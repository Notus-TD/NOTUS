package com.pfc.notus.falta.dto;

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
