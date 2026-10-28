package com.pfc.notus.boletim.domain;

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
