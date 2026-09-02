package com.pfc.notus.nota.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NotaDTO(Long id, @NotNull Float rate, @NotBlank String period ) {
}
