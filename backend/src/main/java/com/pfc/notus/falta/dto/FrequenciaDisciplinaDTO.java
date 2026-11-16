package com.pfc.notus.falta.dto;

// ! REFF: Frequência de um aluno em uma disciplina: total de aulas, faltas e % de presença
public record FrequenciaDisciplinaDTO(
        Long studentId,
        String studentName,
        Long disciplinaId,
        String disciplinaTitle,
        long totalAulas,
        long totalFaltas,
        double percentualPresenca
) {
}
