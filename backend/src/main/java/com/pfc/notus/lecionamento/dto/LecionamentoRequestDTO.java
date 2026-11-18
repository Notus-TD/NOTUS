package com.pfc.notus.lecionamento.dto;

import jakarta.validation.constraints.NotNull;

// ! REFL: Corpo do POST /lecionamento: ids da turma, disciplina e professor
public record LecionamentoRequestDTO(
        @NotNull Long turmaId,
        @NotNull Long disciplinaId,
        @NotNull Long professorId
) {
}
