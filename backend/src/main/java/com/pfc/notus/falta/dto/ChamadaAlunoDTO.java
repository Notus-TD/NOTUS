package com.pfc.notus.falta.dto;

public record ChamadaAlunoDTO(
        Long studentId,
        String studentName,
        Long matricula,
        int faltasNoDia,
        int totalFaltas
) {
}
