package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ProfessorRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email
) {
    public ProfessorRequest {
        fullName = fullName == null ? null : fullName.trim();
        email = User.normalizarEmail(email);
    }
}
