package com.pfc.notus.disciplina.dto;

import java.time.LocalDateTime;

public record DisciplinaDTO(String title, String description, LocalDateTime dueDate) {
}
