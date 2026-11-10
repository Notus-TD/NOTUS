package com.pfc.notus.calendario.dto;

import com.pfc.notus.boletim.domain.Bimestre;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PeriodoRequest(
        @NotNull Bimestre bimestre,
        @NotNull LocalDate inicio,
        @NotNull LocalDate fim
) {
}
