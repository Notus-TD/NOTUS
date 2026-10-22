package com.pfc.notus.entrega.dto;

import com.pfc.notus.entrega.domain.StatusEntrega;
import jakarta.validation.constraints.NotNull;

public record EntregaRequestDTO(
        @NotNull Long atividadeId,
        @NotNull Long studentId,
        @NotNull StatusEntrega status
) {
}
