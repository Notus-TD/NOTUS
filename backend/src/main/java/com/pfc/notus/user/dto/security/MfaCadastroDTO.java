package com.pfc.notus.user.dto.security;

// ! REFU: Resposta do cadastro MFA: URI do QR code e o segredo em base32 para digitar à mão
public record MfaCadastroDTO(String uri, String segredo) {
}
