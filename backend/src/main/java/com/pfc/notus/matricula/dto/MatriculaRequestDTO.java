package com.pfc.notus.matricula.dto;

import jakarta.validation.constraints.NotNull;

public record MatriculaRequestDTO(Long id,  @NotNull Long userId) {
}
