package com.pfc.notus.falta.dto;

import jakarta.validation.constraints.NotNull;

public record ChamadaFaltaRequestDTO(
        @NotNull Long studentId,
        @NotNull Integer faltas
) {
}
