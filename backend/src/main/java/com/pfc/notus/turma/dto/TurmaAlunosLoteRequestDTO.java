package com.pfc.notus.turma.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

// ! REFT: Corpo do POST /turma/{id}/alunos/lote: lista de ids de alunos (não pode ser vazia)
public record TurmaAlunosLoteRequestDTO(@NotEmpty List<Long> studentIds) {
}
