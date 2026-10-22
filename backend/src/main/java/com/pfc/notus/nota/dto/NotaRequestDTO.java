package com.pfc.notus.nota.dto;

import com.pfc.notus.boletim.domain.Bimestre;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NotaRequestDTO(
        @NotBlank String descricao,
        @NotNull @DecimalMin("0.0") @DecimalMax("10.0") Float rate,
        @NotNull Bimestre bimestre,
        @NotNull Long studentId,
        @NotNull Long disciplinaId
) {
}
