package com.pfc.notus.comunicado.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Recado do professor para uma turma específica */
public record RecadoProfessorRequest(
        @NotBlank @Size(max = 150) String titulo,
        @NotBlank @Size(max = 4000) String texto,
        @NotNull Long turmaId
) {
}
