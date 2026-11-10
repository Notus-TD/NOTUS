package com.pfc.notus.privacidade.domain;

public enum MotivoAnonimizacao {
    PEDIDO_DO_TITULAR("Pedido do titular"),
    FIM_DO_PRAZO_DE_GUARDA("Fim do prazo de guarda"),
    DETERMINACAO_LEGAL("Determinação legal ou judicial"),
    OUTRO("Outro motivo");

    private final String descricao;

    MotivoAnonimizacao(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
