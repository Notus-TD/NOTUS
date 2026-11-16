package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EsqueciSenhaRequest(@NotBlank @Email String email) {
    public EsqueciSenhaRequest {
        email = User.normalizarEmail(email);
    }
}
