package com.pfc.notus.entrega.dto;

import com.pfc.notus.entrega.domain.StatusEntrega;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record EntregaRequestDTO(
        @NotNull Long atividadeId,
        @NotNull Long studentId,
        @NotNull StatusEntrega status,
        @DecimalMin("0.0") Float pontosObtidos
) {
    public EntregaRequestDTO(Long atividadeId, Long studentId, StatusEntrega status) {
        this(atividadeId, studentId, status, null);
    }
}
