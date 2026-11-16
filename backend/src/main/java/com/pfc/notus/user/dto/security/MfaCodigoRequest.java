package com.pfc.notus.user.dto.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

// ! REFU: Corpo do verificar/confirmar MFA: desafio do login e código de 6 dígitos
public record MfaCodigoRequest(
        @NotBlank String desafio,
        @NotBlank @Pattern(regexp = "\\d{6}", message = "O código tem 6 números.") String codigo
) {
}
