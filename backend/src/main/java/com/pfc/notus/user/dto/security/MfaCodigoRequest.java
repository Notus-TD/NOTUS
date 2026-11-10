package com.pfc.notus.user.dto.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MfaCodigoRequest(
        @NotBlank String desafio,
        @NotBlank @Pattern(regexp = "\\d{6}", message = "O código tem 6 números.") String codigo
) {
}
