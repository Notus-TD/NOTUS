package com.pfc.notus.boletim.dto;

import com.pfc.notus.boletim.domain.Bimestre;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

// ! REFB: Corpo do PUT /boletim/nota-final: aluno, disciplina, bimestre e a nota (0 a 10)
public record NotaFinalRequestDTO(
        @NotNull Long studentId,
        @NotNull Long disciplinaId,
        @NotNull Bimestre bimestre,
        @NotNull @DecimalMin("0.0") @DecimalMax("10.0") Float notaFinal
) {
}
