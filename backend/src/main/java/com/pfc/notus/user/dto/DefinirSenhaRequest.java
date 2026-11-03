package com.pfc.notus.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** aceiteTermos só é obrigatório quando o link é de convite (primeiro acesso). */
public record DefinirSenhaRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8) String novaSenha,
        Boolean aceiteTermos
) {
}
