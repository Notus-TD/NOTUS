package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AcessoAlunoRequest(
        @NotBlank @Email String email
) {
    public AcessoAlunoRequest {
        email = User.normalizarEmail(email);
    }
}
