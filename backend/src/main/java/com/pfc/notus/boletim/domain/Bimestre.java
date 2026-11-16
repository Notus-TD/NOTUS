package com.pfc.notus.boletim.domain;

// ! REFB: Os 4 bimestres do ano, com descrição amigável para exibir na tela
public enum Bimestre {
    PRIMEIRO("1º bimestre"),
    SEGUNDO("2º bimestre"),
    TERCEIRO("3º bimestre"),
    QUARTO("4º bimestre");

    private final String descricao;

    Bimestre(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
