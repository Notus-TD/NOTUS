package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;

import java.time.LocalDate;

// ! REFU: Dados do aluno no cadastro/edição: nome, e-mail (opcional), matrícula e nascimento (no passado)
public record StudentRequest(
        @NotBlank String fullName,
        @Email String educationalEmail,
        @NotNull Long matricula,
        @NotNull @Past LocalDate birthDate
) {
    // ! REFU: tira espaços do nome e normaliza o e-mail
    public StudentRequest {
        fullName = fullName == null ? null : fullName.trim();
        educationalEmail = User.normalizarEmail(educationalEmail);
    }
}
