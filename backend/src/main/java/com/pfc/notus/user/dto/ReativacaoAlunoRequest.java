package com.pfc.notus.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;

import java.time.LocalDate;

/** Dados novos de um aluno anonimizado que volta a estudar; a matrícula e o histórico continuam os mesmos. */
public record ReativacaoAlunoRequest(
        @Valid @NotNull ResponsibleRequest responsible,
        @NotBlank String fullName,
        @NotBlank @Email String educationalEmail,
        @NotNull @Past LocalDate birthDate
) {
}
