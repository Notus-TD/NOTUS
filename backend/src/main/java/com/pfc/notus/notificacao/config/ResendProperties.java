package com.pfc.notus.notificacao.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * API de e-mail do Resend (notificacao.canal=email).
 * Sem domínio verificado, o Resend só aceita o remetente onboarding@resend.dev e só entrega
 * para o e-mail da própria conta; para outros destinatários responde 403 (validation_error).
 */
@ConfigurationProperties(prefix = "resend")
public record ResendProperties(String apiKey, String remetente, String baseUrl) {

    public ResendProperties {
        if (remetente == null || remetente.isBlank()) remetente = "NOTUS <onboarding@resend.dev>";
        if (baseUrl == null || baseUrl.isBlank()) baseUrl = "https://api.resend.com";
    }

    public boolean credenciaisConfiguradas() {
        return apiKey != null && !apiKey.isBlank();
    }
}
