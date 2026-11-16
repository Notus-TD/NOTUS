package com.pfc.notus.calendario.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

// ! REFCAL: Corpo do PUT /calendario/{ano}: exatamente 4 períodos
public record CalendarioRequest(
        @NotNull @Size(min = 4, max = 4) List<@Valid @NotNull PeriodoRequest> periodos
) {
}
