package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// ! REFU: Corpo do POST /auth/esqueci-senha: e-mail (normalizado)
public record EsqueciSenhaRequest(@NotBlank @Email String email) {
    public EsqueciSenhaRequest {
        email = User.normalizarEmail(email);
    }
}
