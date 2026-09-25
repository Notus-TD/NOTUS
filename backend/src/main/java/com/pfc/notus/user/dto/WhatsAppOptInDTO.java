package com.pfc.notus.user.dto;

import java.time.LocalDateTime;

public record WhatsAppOptInDTO(boolean ativo, LocalDateTime atualizadoEm, String telefone, boolean telefoneValido) {
}
