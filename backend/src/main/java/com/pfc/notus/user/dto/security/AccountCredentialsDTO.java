package com.pfc.notus.user.dto.security;

import com.pfc.notus.user.domain.User;

// ! REFU: Corpo do login: e-mail (normalizado) e senha
public record AccountCredentialsDTO(String email, String password) {
    public AccountCredentialsDTO {
        email = User.normalizarEmail(email);
    }
}
