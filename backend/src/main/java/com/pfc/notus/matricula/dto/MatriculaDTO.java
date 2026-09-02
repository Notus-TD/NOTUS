package com.pfc.notus.matricula.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MatriculaDTO(Long id, @NotBlank String period, @NotBlank String status, @NotNull Float finalAverage) {
}
