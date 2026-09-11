package com.pfc.notus.matricula.dto;

import com.pfc.notus.matricula.domain.StatusMatricula;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MatriculaDTO(Long id, @NotBlank String period, StatusMatricula status, @NotNull Long userId) {
}
