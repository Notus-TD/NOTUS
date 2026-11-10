package com.pfc.notus.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResponsibleRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank @Pattern(regexp = "^\\d{10,11}$", message = "Informe DDD + número (10 ou 11 dígitos)")
        String phone
) {
}
