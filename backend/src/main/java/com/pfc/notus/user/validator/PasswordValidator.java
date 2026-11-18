package com.pfc.notus.user.validator;

import com.pfc.notus.exception.RegraNegocioException;

public class PasswordValidator {

    // REFN: validações de senha forte
    private static final int MIN_LENGTH = 8;
    private static final String REGEX_UPPER = ".*[A-Z].*";
    private static final String REGEX_LOWER = ".*[a-z].*";
    private static final String REGEX_DIGIT = ".*[0-9].*";
    private static final String REGEX_SPECIAL = ".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>?/~`].*";

    // REFN: valida se a senha atende todos os critérios
    public static void validarSenhaForte(String senha) {
        if (senha == null || senha.isBlank()) {
            throw new RegraNegocioException("Senha não pode ser vazia.");
        }

        if (senha.length() < MIN_LENGTH) {
            throw new RegraNegocioException("Senha deve ter no mínimo 8 caracteres.");
        }

        if (!senha.matches(REGEX_UPPER)) {
            throw new RegraNegocioException("Senha deve conter pelo menos 1 letra maiúscula.");
        }

        if (!senha.matches(REGEX_LOWER)) {
            throw new RegraNegocioException("Senha deve conter pelo menos 1 letra minúscula.");
        }

        if (!senha.matches(REGEX_DIGIT)) {
            throw new RegraNegocioException("Senha deve conter pelo menos 1 número.");
        }

        if (!senha.matches(REGEX_SPECIAL)) {
            throw new RegraNegocioException("Senha deve conter pelo menos 1 caractere especial (!@#$%^&*).");
        }
    }
}
