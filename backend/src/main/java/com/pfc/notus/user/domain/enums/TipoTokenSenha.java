package com.pfc.notus.user.domain.enums;

import java.time.Duration;

/** Para que serve o link enviado por e-mail e por quanto tempo ele vale. */
public enum TipoTokenSenha {

    /** Primeiro acesso: o usuário define a senha e aceita os termos. */
    CONVITE(Duration.ofDays(7), "7 dias"),

    /** "Esqueci minha senha". */
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
