package com.pfc.notus.entrega.dto;

import com.pfc.notus.boletim.domain.Bimestre;
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
}
