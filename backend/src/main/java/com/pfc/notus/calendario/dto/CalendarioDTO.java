package com.pfc.notus.calendario.dto;

import com.pfc.notus.boletim.domain.Bimestre;

import java.time.LocalDate;
import java.util.List;

// ! REFCAL: Resposta do GET /calendario: ano, se está cadastrado, início/fim, bimestre atual e a lista dos períodos
public record CalendarioDTO(
        String anoLetivo,
        boolean cadastrado,
        LocalDate inicio,
        LocalDate fim,
        Bimestre bimestreAtual,
        List<PeriodoDTO> periodos
) {
}
