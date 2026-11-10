package com.pfc.notus.calendario.dto;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.calendario.domain.PeriodoLetivo;
import com.pfc.notus.calendario.domain.SituacaoPeriodo;

import java.time.LocalDate;

public record PeriodoDTO(
        Bimestre bimestre,
        String descricao,
        LocalDate inicio,
        LocalDate fim,
        SituacaoPeriodo situacao,
        boolean lancamentoAberto
) {
    public static PeriodoDTO from(PeriodoLetivo p, LocalDate hoje) {
        SituacaoPeriodo situacao = p.situacao(hoje);
        return new PeriodoDTO(p.getBimestre(), p.getBimestre().getDescricao(), p.getInicio(), p.getFim(),
                situacao, situacao != SituacaoPeriodo.FECHADO);
    }
}
