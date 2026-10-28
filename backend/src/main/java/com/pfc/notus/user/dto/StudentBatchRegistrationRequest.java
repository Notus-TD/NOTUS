package com.pfc.notus.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

// Um responsável com um ou mais alunos sob sua responsabilidade, cadastrados de uma vez.
public record StudentBatchRegistrationRequest(
        @Valid @NotNull ResponsibleRequest responsible,
        @NotEmpty(message = "Informe pelo menos um aluno")
        @Size(max = 10, message = "Cadastre no máximo 10 alunos por vez")
        List<@Valid @NotNull StudentRequest> students
) {
}
