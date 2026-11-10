package com.pfc.notus.user.dto.security;

import java.time.Instant;

public record LoginRespostaDTO(String etapa, String email, String token, Instant expiresAt, String desafio) {

    public static final String CONCLUIDO = "CONCLUIDO";
    public static final String MFA = "MFA";
    public static final String MFA_CADASTRO = "MFA_CADASTRO";

    public static LoginRespostaDTO concluido(String email, String token, Instant expiresAt) {
        return new LoginRespostaDTO(CONCLUIDO, email, token, expiresAt, null);
    }

    public static LoginRespostaDTO desafio(String etapa, String email, String desafio) {
        return new LoginRespostaDTO(etapa, email, null, null, desafio);
    }
}
