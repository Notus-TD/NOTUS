package com.pfc.notus.notificacao.service;

import com.pfc.notus.notificacao.config.NotificacaoProperties;
import com.pfc.notus.notificacao.port.NotificadorPort;
import com.pfc.notus.notificacao.port.ResultadoEnvio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Envia as notificações pendentes em segundo plano, fora de qualquer requisição do usuário.
 * Cada notificação é tratada isoladamente: um erro numa não impede o envio das outras.
 *
 * O envio é imediato: quem cria uma notificação chama {@link #processarAgora()} depois do commit.
 * A rodada agendada (a cada notificacao.worker-intervalo-ms) continua como reserva, para novas
 * tentativas de falhas temporárias e para envios que ficaram presos.
 * Só um ciclo roda por vez: um pedido que chega durante um ciclo marca que é preciso mais uma
 * volta, feita logo que o ciclo atual termina. Assim nenhuma notificação é enviada em dobro.
 */
@Component
public class NotificacaoWorker {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoWorker.class);

    @Autowired
    private NotificacaoEnvioService envioService;

    @Autowired
    private NotificadorPort notificador;

    @Autowired
    private NotificacaoProperties properties;

    private final ReentrantLock emExecucao = new ReentrantLock();
    private final AtomicBoolean pedidoPendente = new AtomicBoolean(false);

    /** Rodada de reserva: novas tentativas e envios presos. */
    @Scheduled(fixedDelayString = "${notificacao.worker-intervalo-ms:600000}",
            initialDelayString = "${notificacao.worker-atraso-inicial-ms:15000}")
    public void processar() {
        executar();
    }

    /** Envio imediato, chamado depois que uma notificação nova (ou reenviada) foi salva. */
    @Async
    public void processarAgora() {
        executar();
    }

    void executar() {
        pedidoPendente.set(true);
        // Se outro ciclo está rodando, ele vê o pedido e dá mais uma volta; quem sai do lock
        // confere de novo o pedido para não perder um que chegou no meio da saída.
        while (pedidoPendente.get() && emExecucao.tryLock()) {
            try {
                while (pedidoPendente.getAndSet(false)) {
                    ciclo();
                }
            } finally {
                emExecucao.unlock();
            }
        }
    }

    private void ciclo() {
        LocalDateTime inicioCiclo = LocalDateTime.now();
        try {
            // Repete os lotes até a fila esvaziar; cada notificação é pega no máximo uma vez por ciclo.
            List<Long> ids;
            while (!(ids = envioService.reservarLote(inicioCiclo)).isEmpty()) {
                if (!enviarLote(ids)) return;
            }
        } catch (RuntimeException e) {
            log.error("Erro no ciclo de envio de notificações; nova tentativa no próximo ciclo", e);
        }
    }

    /** @return false se a thread foi interrompida (aplicação encerrando). */
    private boolean enviarLote(List<Long> ids) {
        long pausaMs = Math.max(1, 1000L / properties.taxaPorSegundo());
        for (Long id : ids) {
            try {
                envioService.preparar(id).ifPresent(envio -> {
                    ResultadoEnvio resultado;
                    try {
                        resultado = notificador.enviar(envio.email(), envio.template(), envio.variaveis());
                    } catch (RuntimeException e) {
                        resultado = ResultadoEnvio.temporario("Erro inesperado no envio: " + e.getMessage());
                    }
                    envioService.registrarResultado(id, resultado);
                });
            } catch (RuntimeException e) {
                log.error("Erro ao processar notificação {}", id, e);
            }

            try {
                Thread.sleep(pausaMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return true;
    }
}
