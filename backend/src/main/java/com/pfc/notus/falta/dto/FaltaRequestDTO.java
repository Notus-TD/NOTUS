package com.pfc.notus.falta.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record FaltaRequestDTO(
        @NotNull LocalDate data,
        @NotNull @Positive Integer quantidade,
        @NotNull Long studentId,
        @NotNull Long disciplinaId
) {
}
