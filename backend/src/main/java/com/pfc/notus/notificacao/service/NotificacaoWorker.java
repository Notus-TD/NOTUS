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

@Component
@RequiredArgsConstructor
public class NotificacaoWorker {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoWorker.class);

    private final NotificacaoEnvioService envioService;

    private final NotificadorPort notificador;

    private final NotificacaoProperties properties;

    private final ReentrantLock emExecucao = new ReentrantLock();
    private final AtomicBoolean pedidoPendente = new AtomicBoolean(false);

    @Scheduled(fixedDelayString = "${notificacao.worker-intervalo-ms:600000}",
            initialDelayString = "${notificacao.worker-atraso-inicial-ms:15000}")
    public void processar() {
        executar();
    }

    @Async
    public void processarAgora() {
        executar();
    }

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
    private ResultadoEnvio enviar(NotificacaoEnvioService.EnvioPreparado envio) {
        try {
            return notificador.enviar(envio.email(), envio.template(), envio.variaveis());
        } catch (RuntimeException e) {
            return ResultadoEnvio.temporario("Erro inesperado no envio: " + e.getMessage());
        }
    }

    /** Respeita o limite de envios por segundo do provedor. Retorna false se o servidor está desligando. */
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
