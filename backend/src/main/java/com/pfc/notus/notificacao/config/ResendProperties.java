package com.pfc.notus.notificacao.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "resend")
public record ResendProperties(String apiKey, String remetente, String baseUrl, String redirecionarPara) {

    public ResendProperties {
        if (remetente == null || remetente.isBlank()) remetente = "NOTUS <onboarding@resend.dev>";
        if (baseUrl == null || baseUrl.isBlank()) baseUrl = "https://api.resend.com";
    }

    public boolean redirecionamentoAtivo() {
        return redirecionarPara != null && !redirecionarPara.isBlank();
    }

    public boolean credenciaisConfiguradas() {
        return apiKey != null && !apiKey.isBlank();
    }
}
