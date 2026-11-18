package com.pfc.notus.falta.dto;

import jakarta.validation.constraints.NotNull;

// ! REFF: Um aluno na chamada: id e quantas faltas teve no dia (0 = presente)
public record ChamadaFaltaRequestDTO(
        @NotNull Long studentId,
        @NotNull Integer faltas
) {
}
