package com.pfc.notus.user.dto.security;

import jakarta.validation.constraints.NotBlank;

public record MfaDesafioRequest(@NotBlank String desafio) {
}
