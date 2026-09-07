package com.pfc.notus.presenca.dto;

import com.pfc.notus.presenca.domain.StatusPresenca;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PresencaDTO(
        Long id,
        @NotNull LocalDate date,
        @NotNull StatusPresenca status,
        @NotNull Long studentId,
        @NotNull Long disciplinaId
) {
}
