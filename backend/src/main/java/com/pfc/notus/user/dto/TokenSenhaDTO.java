package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.enums.TipoTokenSenha;

// ! REFU: Resposta do validar token: se é convite ou redefinição e o e-mail mascarado
public record TokenSenhaDTO(TipoTokenSenha tipo, String emailMascarado) {
}
