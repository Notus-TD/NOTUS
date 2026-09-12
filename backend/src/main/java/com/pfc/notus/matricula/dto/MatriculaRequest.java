package com.pfc.notus.matricula.dto;

import com.pfc.notus.matricula.domain.StatusMatricula;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MatriculaRequest(
        @NotBlank String period,
        StatusMatricula status,
        @NotNull Long studentId
) {
}
