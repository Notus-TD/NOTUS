package com.pfc.notus.user.dto;

import jakarta.validation.constraints.NotNull;

public record WhatsAppOptInRequest(@NotNull Boolean ativo) {
}
