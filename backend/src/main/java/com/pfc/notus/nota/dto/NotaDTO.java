package com.pfc.notus.nota.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NotaDTO(Long id, @NotNull @DecimalMin("0.0") @DecimalMax("10.0") Float rate, @NotBlank String period, @NotNull Long boletimId, @NotNull Long disciplinaId) {
}
