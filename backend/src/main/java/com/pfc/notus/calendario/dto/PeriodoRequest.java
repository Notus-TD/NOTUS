package com.pfc.notus.calendario.dto;

import com.pfc.notus.boletim.domain.Bimestre;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

// ! REFCAL: Um bimestre no corpo do PUT: qual bimestre e suas datas de início e fim
public record PeriodoRequest(
        @NotNull Bimestre bimestre,
        @NotNull LocalDate inicio,
        @NotNull LocalDate fim
) {
}
