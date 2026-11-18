package com.pfc.notus.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// ! REFU: Corpo do cancelar matrícula: motivo (até 300 caracteres)
public record CancelamentoMatriculaRequest(@NotBlank @Size(max = 300) String motivo) {
}
