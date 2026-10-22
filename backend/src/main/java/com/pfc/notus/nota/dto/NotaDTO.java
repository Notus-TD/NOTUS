package com.pfc.notus.nota.dto;

import com.pfc.notus.boletim.domain.Bimestre;

public record NotaDTO(
        Long id,
        String descricao,
        Float rate,
        Bimestre bimestre,
        Long studentId,
        Long disciplinaId,
        String disciplinaTitle
) {
}
