package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResponsibleRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank @Pattern(regexp = "^\\d{10,11}$", message = "Informe DDD + número (10 ou 11 dígitos)")
        String phone
) {
    // Nome sem espaços nas pontas e e-mail normalizado: assim o cadastro de irmãos reencontra o mesmo responsável.
    public ResponsibleRequest {
        name = name == null ? null : name.trim();
        email = User.normalizarEmail(email);
        phone = phone == null ? null : phone.trim();
    }
}
