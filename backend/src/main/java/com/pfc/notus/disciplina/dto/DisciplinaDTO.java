package com.pfc.notus.disciplina.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

// ! REFD: Dados da disciplina na API; título (máx 100) e descrição (máx 255) obrigatórios
public record DisciplinaDTO(
        Long id,
        @NotBlank @Size(max = 100) String title,
        @NotBlank @Size(max = 255) String description,
        LocalDateTime dueDate
) {
    // ! REFD: tira espaços das pontas do título e da descrição
    public DisciplinaDTO {
        title = title == null ? null : title.trim();
        description = description == null ? null : description.trim();
    }
}
