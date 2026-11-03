package com.pfc.notus.user.dto;

import jakarta.validation.constraints.NotBlank;

/** O token vai no corpo, não na URL, para não aparecer nos logs de auditoria. */
public record ValidarTokenSenhaRequest(@NotBlank String token) {
}
