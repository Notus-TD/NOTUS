package com.pfc.notus.falta.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record ChamadaRequestDTO(
        @NotNull Long turmaId,
        @NotNull Long disciplinaId,
        @NotNull LocalDate data,
        @NotNull Integer aulas,
        @NotNull List<@Valid @NotNull ChamadaFaltaRequestDTO> faltas
) {
}
