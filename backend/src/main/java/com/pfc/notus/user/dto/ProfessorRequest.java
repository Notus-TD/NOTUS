package com.pfc.notus.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ProfessorRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email
) {
}
