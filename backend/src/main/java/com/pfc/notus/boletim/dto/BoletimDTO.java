package com.pfc.notus.boletim.dto;

import com.pfc.notus.boletim.domain.Bimestre;

import java.time.LocalDateTime;

public record BoletimDTO(
        Long id,
        Long studentId,
        Long disciplinaId,
        String disciplinaTitle,
        Bimestre bimestre,
        Float mediaCalculada,
        Float notaFinal,
        Float nota,
        LocalDateTime lancadoEm
) {
}
