package com.pfc.notus.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DefinirSenhaRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8) String novaSenha,
        Boolean aceiteTermos
) {
}
