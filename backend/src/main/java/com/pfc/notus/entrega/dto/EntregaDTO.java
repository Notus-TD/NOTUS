package com.pfc.notus.entrega.dto;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.entrega.domain.StatusEntrega;

// REFN: DTO de saída para entrega (status + info da atividade)
public record EntregaDTO(
        Long id,
        StatusEntrega status,
        Long atividadeId,
        String atividadeTitle,
        Long disciplinaId,
        Bimestre bimestre,
        Long studentId,
        Float pontos
) {
}
