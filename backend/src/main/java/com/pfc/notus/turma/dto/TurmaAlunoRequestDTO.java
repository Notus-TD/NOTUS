package com.pfc.notus.turma.dto;

import jakarta.validation.constraints.NotNull;

// ! REFT: Corpo do POST /turma/{id}/alunos: id do aluno
public record TurmaAlunoRequestDTO(@NotNull Long studentId) {
}
