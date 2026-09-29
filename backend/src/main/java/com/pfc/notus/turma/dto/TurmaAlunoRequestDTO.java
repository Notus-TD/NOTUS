package com.pfc.notus.turma.dto;

import jakarta.validation.constraints.NotNull;

public record TurmaAlunoRequestDTO(@NotNull Long studentId) {
}
