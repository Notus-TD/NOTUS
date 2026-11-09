package com.pfc.notus.turma.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record TurmaAlunosLoteRequestDTO(@NotEmpty List<Long> studentIds) {
}
