package com.pfc.notus.entrega.dto;

import com.pfc.notus.entrega.domain.StatusEntrega;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record EntregaDTO(
        Long id,
        String content,
        LocalDateTime submittedAt,
        Float grade,
        @NotNull StatusEntrega status,
        @NotNull Long atividadeId,
        @NotNull Long studentId
) {
}
