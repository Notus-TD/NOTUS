package com.pfc.notus.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AcessoAlunoRequest(
        @NotBlank @Email String email
) {
}
