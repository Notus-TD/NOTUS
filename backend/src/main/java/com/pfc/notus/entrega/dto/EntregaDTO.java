package com.pfc.notus.entrega.dto;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.entrega.domain.Entrega;
import com.pfc.notus.entrega.domain.StatusEntrega;

public record EntregaDTO(
        Long id,
        StatusEntrega status,
        Long atividadeId,
        String atividadeTitle,
        Long disciplinaId,
        Bimestre bimestre,
        Long studentId,
        Float pontos,
        Float pontosObtidos
) {
    public static EntregaDTO from(Entrega e) {
        return new EntregaDTO(e.getId(), e.getStatus(), e.getAtividade().getId(), e.getAtividade().getTitle(),
                e.getAtividade().getDisciplina().getId(), e.getAtividade().getBimestre(), e.getStudent().getId(),
                e.getAtividade().getPontos(), e.getPontosObtidos());
    }
}
