package com.pfc.notus.lecionamento.dto;

import jakarta.validation.constraints.NotNull;

public record LecionamentoRequestDTO(
        @NotNull Long turmaId,
        @NotNull Long disciplinaId,
        @NotNull Long professorId
) {
}
