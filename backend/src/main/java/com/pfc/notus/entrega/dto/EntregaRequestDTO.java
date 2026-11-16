package com.pfc.notus.entrega.dto;

import com.pfc.notus.entrega.domain.StatusEntrega;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

// ! REFE: Corpo do PUT /entrega: atividade, aluno, status e pontos (opcional)
public record EntregaRequestDTO(
        @NotNull Long atividadeId,
        @NotNull Long studentId,
        @NotNull StatusEntrega status,
        @DecimalMin("0.0") Float pontosObtidos
) {
    // ! REFE: atalho sem pontos, usado nos testes
    public EntregaRequestDTO(Long atividadeId, Long studentId, StatusEntrega status) {
        this(atividadeId, studentId, status, null);
    }
}
