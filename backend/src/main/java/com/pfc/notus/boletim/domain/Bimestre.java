package com.pfc.notus.boletim.domain;

public enum Bimestre {
    PRIMEIRO("1º bimestre", 1),
    SEGUNDO("2º bimestre", 1),
    TERCEIRO("3º bimestre", 2),
    QUARTO("4º bimestre", 2);

    private final String descricao;
    private final int semestre;

    Bimestre(String descricao, int semestre) {
        this.descricao = descricao;
        this.semestre = semestre;
    }

    public String getDescricao() {
        return descricao;
    }

    public int getSemestre() {
        return semestre;
    }
}
