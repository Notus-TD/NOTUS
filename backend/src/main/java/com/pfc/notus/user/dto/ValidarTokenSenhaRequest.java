package com.pfc.notus.user.dto;

import jakarta.validation.constraints.NotBlank;

// ! REFU: Corpo do validar token: o token do link
public record ValidarTokenSenhaRequest(@NotBlank String token) {
}
