package com.pfc.notus.notificacao.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * API de e-mail do Resend (notificacao.canal=email).
 * Sem domínio verificado, o Resend só aceita o remetente onboarding@resend.dev e só entrega
 * para o e-mail da própria conta; para outros destinatários responde 403 (validation_error).
 *
 * redirecionarPara (só para desenvolvimento e demonstração): se preenchido, TODO e-mail enviado
 * pelo sistema vai para esse endereço, com o destinatário original no assunto. Serve para ver
 * chegando os e-mails dos usuários fictícios e funciona com o Resend sem domínio verificado
 * (basta usar o e-mail da própria conta Resend). Em produção deve ficar vazio.
 */
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
