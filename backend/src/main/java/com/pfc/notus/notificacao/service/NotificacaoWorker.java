package com.pfc.notus.notificacao.service;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.notificacao.config.NotificacaoProperties;
import com.pfc.notus.notificacao.port.NotificadorPort;
import com.pfc.notus.notificacao.port.ResultadoEnvio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.ReentrantLock;

// ! REFN: Loop de envio dos e-mails: roda a cada 10 min (ou na hora, quando chamado) e processa a fila em lotes respeitando o limite por segundo
@Component
@RequiredArgsConstructor
public class NotificacaoWorker {

    // ! REFN: log de erros do ciclo
    private static final Logger log = LoggerFactory.getLogger(NotificacaoWorker.class);

    // ! REFN: service que reserva/registra, o provedor de e-mail (porta) e as configs de lote e taxa
    private final NotificacaoEnvioService envioService;

    private final NotificadorPort notificador;

    private final NotificacaoProperties properties;

    // ! REFN: lock para rodar um ciclo por vez e flag de 'tem pedido pendente' para não perder chamada durante a execução
    private final ReentrantLock emExecucao = new ReentrantLock();
    private final AtomicBoolean pedidoPendente = new AtomicBoolean(false);

    @Scheduled(fixedDelayString = "${notificacao.worker-intervalo-ms:600000}",
            initialDelayString = "${notificacao.worker-atraso-inicial-ms:15000}")
    // ! REFN: agendado: roda o ciclo periodicamente
    public void processar() {
        executar();
    }

    // ! REFN: chamado pelo listener/controller: roda o ciclo em outra thread sem esperar o agendamento
    @Async
    public void processarAgora() {
        executar();
    }

    // ! REFN: garante um ciclo por vez; se chamaram de novo enquanto rodava, roda mais uma vez ao terminar
    void executar() {
        pedidoPendente.set(true);
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

    // ! REFN: reserva lotes até a fila esvaziar; erro inesperado espera o próximo ciclo
    private void ciclo() {
        LocalDateTime inicioCiclo = LocalDateTime.now();
        try {
            List<Long> ids;
            while (!(ids = envioService.reservarLote(inicioCiclo)).isEmpty()) {
                if (!enviarLote(ids)) return;
            }
        } catch (RuntimeException e) {
            log.error("Erro no ciclo de envio de notificações; nova tentativa no próximo ciclo", e);
        }
    }

    // ! REFN: para cada id: prepara, envia e registra o resultado, com pausa entre envios; false se o servidor está desligando
    private boolean enviarLote(List<Long> ids) {
        long pausaMs = Math.max(1, 1000L / properties.taxaPorSegundo());
        for (Long id : ids) {
            try {
                envioService.preparar(id).ifPresent(envio -> envioService.registrarResultado(id, enviar(envio)));
            } catch (RuntimeException e) {
                log.error("Erro ao processar notificação {}", id, e);
            }
            if (!pausar(pausaMs)) {
                return false;
            }
        }
        return true;
    }

    /** Erro inesperado do provedor conta como temporário: a notificação volta para a fila. */
    // ! REFN: chama o provedor; exceção vira erro temporário (volta pra fila)
    private ResultadoEnvio enviar(NotificacaoEnvioService.EnvioPreparado envio) {
        try {
            return notificador.enviar(envio.email(), envio.template(), envio.variaveis());
        } catch (RuntimeException e) {
            return ResultadoEnvio.temporario("Erro inesperado no envio: " + e.getMessage());
        }
    }

    /** Respeita o limite de envios por segundo do provedor. Retorna false se o servidor está desligando. */
    // ! REFN: sleep para respeitar o limite por segundo do provedor
    private static boolean pausar(long pausaMs) {
        try {
            Thread.sleep(pausaMs);
            return true;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
}
