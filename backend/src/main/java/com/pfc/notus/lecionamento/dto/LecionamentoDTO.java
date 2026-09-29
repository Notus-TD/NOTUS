package com.pfc.notus.lecionamento.dto;

public record LecionamentoDTO(
        Long id,
        Long turmaId,
        String turmaName,
        Long disciplinaId,
        String disciplinaTitle,
        Long professorId,
        String professorEmail
) {
}
