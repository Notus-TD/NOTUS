package com.pfc.notus.notificacao.whatsapp;

import com.pfc.notus.notificacao.port.NotificadorPort;
import com.pfc.notus.notificacao.port.ResultadoEnvio;
import com.pfc.notus.notificacao.util.TelefoneUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "whatsapp.enabled", havingValue = "false", matchIfMissing = true)
public class LogNotificador implements NotificadorPort {

    private static final Logger log = LoggerFactory.getLogger(LogNotificador.class);

    @Override
    public ResultadoEnvio enviar(String destinoE164, String template, List<String> variaveis) {
        log.info("[WhatsApp desativado] envio simulado | template={} | para={} | {} variáveis",
                template, TelefoneUtil.mascarar(destinoE164), variaveis.size());
        return ResultadoEnvio.sucesso("simulado-" + UUID.randomUUID());
    }
}
