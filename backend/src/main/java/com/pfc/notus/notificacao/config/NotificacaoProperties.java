package com.pfc.notus.notificacao.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "notificacao")
public record NotificacaoProperties(int taxaPorSegundo, int maxTentativas, int lote) {

    public NotificacaoProperties {
        if (taxaPorSegundo <= 0) taxaPorSegundo = 20;
        if (maxTentativas <= 0) maxTentativas = 3;
        if (lote <= 0) lote = 50;
    }
}
