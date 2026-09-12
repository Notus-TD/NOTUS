package com.pfc.notus.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;

import java.time.LocalDate;

public record StudentRequest(
        @NotBlank String fullName,
        @NotBlank @Email String educationalEmail,
        @NotBlank String cpf,
        @NotNull @Past LocalDate birthDate,
        @NotNull Long matricula
) {
}
