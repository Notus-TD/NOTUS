package com.pfc.notus.user.domain.enums;

import java.time.Duration;

// ! REFU: Tipo do link de senha e quanto tempo vale: convite (7 dias) ou redefinição (1 hora)
public enum TipoTokenSenha {

    CONVITE(Duration.ofDays(7), "7 dias"),

    REDEFINICAO(Duration.ofHours(1), "1 hora");

    private final Duration validade;
    private final String validadeDescricao;

    TipoTokenSenha(Duration validade, String validadeDescricao) {
        this.validade = validade;
        this.validadeDescricao = validadeDescricao;
    }

    public Duration getValidade() {
        return validade;
    }

    public String getValidadeDescricao() {
        return validadeDescricao;
    }
}
