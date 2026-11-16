package com.pfc.notus.user.dto.security;

import com.pfc.notus.user.domain.User;

public record AccountCredentialsDTO(String email, String password) {
    public AccountCredentialsDTO {
        email = User.normalizarEmail(email);
    }
}
