package com.pfc.notus.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelamentoMatriculaRequest(@NotBlank @Size(max = 300) String motivo) {
}
