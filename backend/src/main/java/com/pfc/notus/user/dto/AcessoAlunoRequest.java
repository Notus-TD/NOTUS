package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// ! REFU: Corpo do PUT /students/{id}/acesso: e-mail que o aluno vai usar para logar
public record AcessoAlunoRequest(
        @NotBlank @Email String email
) {
    public AcessoAlunoRequest {
        email = User.normalizarEmail(email);
    }
}
