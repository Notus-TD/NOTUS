package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.enums.TipoTokenSenha;

/** Resposta da validação do link: o tipo decide se a tela pede o aceite dos termos. */
public record TokenSenhaDTO(TipoTokenSenha tipo, String emailMascarado) {
}
