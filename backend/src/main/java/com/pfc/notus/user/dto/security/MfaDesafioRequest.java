package com.pfc.notus.user.dto.security;

import jakarta.validation.constraints.NotBlank;

// ! REFU: Corpo do iniciar cadastro MFA: só o desafio do login
public record MfaDesafioRequest(@NotBlank String desafio) {
}
