package com.pfc.notus.user.dto.security;

import java.time.Instant;

// ! REFU: Resposta do login: etapa CONCLUIDO (com token) ou MFA/MFA_CADASTRO (com desafio para a próxima etapa)
public record LoginRespostaDTO(String etapa, String email, String token, Instant expiresAt, String desafio) {

    public static final String CONCLUIDO = "CONCLUIDO";
    public static final String MFA = "MFA";
    public static final String MFA_CADASTRO = "MFA_CADASTRO";

    // ! REFU: login finalizado com JWT e validade
    public static LoginRespostaDTO concluido(String email, String token, Instant expiresAt) {
        return new LoginRespostaDTO(CONCLUIDO, email, token, expiresAt, null);
    }

    // ! REFU: login pendente de MFA; o desafio é um JWT curto que identifica o usuário
    public static LoginRespostaDTO desafio(String etapa, String email, String desafio) {
        return new LoginRespostaDTO(etapa, email, null, null, desafio);
    }
}
