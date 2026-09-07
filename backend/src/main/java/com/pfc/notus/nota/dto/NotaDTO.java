package com.pfc.notus.nota.dto;

import com.pfc.notus.nota.domain.Nota;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NotaDTO(Nota nota) {
}
