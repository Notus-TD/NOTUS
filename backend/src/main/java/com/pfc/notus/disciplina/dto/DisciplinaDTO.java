package com.pfc.notus.disciplina.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public record DisciplinaDTO(Long id, @NotBlank String title, @NotBlank String description, LocalDateTime dueDate) {
}
