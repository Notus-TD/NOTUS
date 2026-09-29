package com.pfc.notus.turma.dto;

public record TurmaAlunoResponseDTO(
        Long turmaId,
        String turmaName,
        Long studentId,
        String studentName,
        Long matricula
) {
}
