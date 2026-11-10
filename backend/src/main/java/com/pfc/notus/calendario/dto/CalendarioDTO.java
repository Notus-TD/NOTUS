package com.pfc.notus.calendario.dto;

import com.pfc.notus.boletim.domain.Bimestre;

import java.time.LocalDate;
import java.util.List;

public record CalendarioDTO(
        String anoLetivo,
        boolean cadastrado,
        LocalDate inicio,
        LocalDate fim,
        Bimestre bimestreAtual,
        List<PeriodoDTO> periodos
) {
}
