package com.pfc.notus.boletim.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BoletimDTO (Long id, @NotBlank String period, @NotNull Float finalAverage, @NotBlank String status) {
}
