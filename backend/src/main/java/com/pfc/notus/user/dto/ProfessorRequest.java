package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// ! REFU: Corpo do POST /professores: nome e e-mail
public record ProfessorRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email
) {
    // ! REFU: tira espaços do nome e normaliza o e-mail
    public ProfessorRequest {
        fullName = fullName == null ? null : fullName.trim();
        email = User.normalizarEmail(email);
    }
}
