package com.pfc.notus.user.dto;

import jakarta.validation.constraints.NotBlank;

public record AnonimizacaoRequestDTO(
        @NotBlank String confirmacao
) {
}
