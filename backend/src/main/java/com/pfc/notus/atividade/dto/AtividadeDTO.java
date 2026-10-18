package com.pfc.notus.atividade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Na criação, o cliente manda título, conteúdo, prazo, turma e (só o admin) a disciplina;
 * o professor tem a disciplina deduzida pelo lecionamento. Os demais campos são de resposta.
 */
public record AtividadeDTO(
        Long id,
        @NotBlank String title,
        @NotBlank String content,
        String status,
        @NotNull LocalDate prazo,
        @NotNull Long turmaId,
        Long disciplinaId,
        String turmaName,
        String disciplinaTitle,
        LocalDateTime publicadaEm,
        Boolean entregue
) {
}
