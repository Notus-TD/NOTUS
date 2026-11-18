package com.pfc.notus.turma.dto;

import jakarta.validation.constraints.NotBlank;

// ! REFT: Corpo do POST/PUT /turma: nome e ano letivo, ambos obrigatórios
public record TurmaRequestDTO(@NotBlank String name, @NotBlank String schoolYear) {
}
