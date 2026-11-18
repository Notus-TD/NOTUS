package com.pfc.notus.turma.dto;

// ! REFT: Resposta ao associar: turma e aluno (nome e matrícula)
public record TurmaAlunoResponseDTO(
        Long turmaId,
        String turmaName,
        Long studentId,
        String studentName,
        Long matricula
) {
}
