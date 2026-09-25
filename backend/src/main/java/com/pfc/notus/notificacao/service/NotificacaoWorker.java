package com.pfc.notus.notificacao.service;

import com.pfc.notus.notificacao.config.NotificacaoProperties;
import com.pfc.notus.notificacao.port.NotificadorPort;
import com.pfc.notus.notificacao.port.ResultadoEnvio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class NotificacaoWorker {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoWorker.class);

    @Autowired
    private NotificacaoEnvioService envioService;

    @Autowired
    private NotificadorPort notificador;

    @Autowired
    private NotificacaoProperties properties;

    @Scheduled(fixedDelayString = "${notificacao.worker-intervalo-ms:10000}",
            initialDelayString = "${notificacao.worker-atraso-inicial-ms:15000}")
    public void processar() {
        List<Long> ids = envioService.reservarLote();
        if (ids.isEmpty()) return;

        long pausaMs = Math.max(1, 1000L / properties.taxaPorSegundo());
        for (Long id : ids) {
            try {
                envioService.preparar(id).ifPresent(envio -> {
                    ResultadoEnvio resultado;
                    try {
                        resultado = notificador.enviar(envio.telefone(), envio.template(), envio.variaveis());
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
                return;
            }
        }
    }
}
