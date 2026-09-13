package com.pfc.notus.disciplina.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AulaRequestDTO(@NotNull LocalDate data) {
}
