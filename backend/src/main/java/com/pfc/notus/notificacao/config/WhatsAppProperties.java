package com.pfc.notus.notificacao.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "whatsapp")
public record WhatsAppProperties(
        boolean enabled,
        String token,
        String phoneNumberId,
        String verifyToken,
        String appSecret,
        String apiVersion,
        String baseUrl,
        String idioma
) {
    public WhatsAppProperties {
        if (apiVersion == null || apiVersion.isBlank()) apiVersion = "v23.0";
        if (baseUrl == null || baseUrl.isBlank()) baseUrl = "https://graph.facebook.com";
        if (idioma == null || idioma.isBlank()) idioma = "pt_BR";
    }

    public boolean credenciaisConfiguradas() {
        return token != null && !token.isBlank() && phoneNumberId != null && !phoneNumberId.isBlank();
    }
}
