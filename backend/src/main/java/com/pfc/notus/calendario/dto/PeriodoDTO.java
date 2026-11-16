package com.pfc.notus.calendario.dto;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.calendario.domain.PeriodoLetivo;

import java.time.LocalDate;

// ! REFCAL: Um bimestre na resposta, com descrição e se ainda está aberto para lançamento
public record PeriodoDTO(
        Bimestre bimestre,
        String descricao,
        LocalDate inicio,
        LocalDate fim,
        boolean lancamentoAberto
) {
    // ! REFCAL: converte a entidade calculando se está aberto em relação a hoje
    public static PeriodoDTO from(PeriodoLetivo p, LocalDate hoje) {
        return new PeriodoDTO(p.getBimestre(), p.getBimestre().getDescricao(), p.getInicio(), p.getFim(), p.aberto(hoje));
    }
}
