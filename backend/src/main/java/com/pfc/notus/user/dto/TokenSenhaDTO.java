package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.enums.TipoTokenSenha;

public record TokenSenhaDTO(TipoTokenSenha tipo, String emailMascarado) {
}
