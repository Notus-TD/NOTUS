package com.pfc.notus.falta.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record FaltaDTO(
        Long id,
        @NotNull LocalDate data,
        @NotNull @Positive Integer quantidade,
        LocalDateTime registradoEm,
        @NotNull Long studentId,
        @NotNull Long disciplinaId,
        @NotNull Long registradoPorId
) {
}
