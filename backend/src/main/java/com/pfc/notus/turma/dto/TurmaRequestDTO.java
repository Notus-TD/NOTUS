package com.pfc.notus.turma.dto;

import jakarta.validation.constraints.NotBlank;

public record TurmaRequestDTO(@NotBlank String name, @NotBlank String schoolYear) {
}
