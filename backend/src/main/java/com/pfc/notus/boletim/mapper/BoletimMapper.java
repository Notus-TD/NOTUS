package com.pfc.notus.boletim.mapper;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.disciplina.domain.Disciplina;

public class BoletimMapper {

    public static BoletimDTO toDto(Boletim boletim, Float mediaSugerida) {
        return new BoletimDTO(
                boletim.getId(),
                boletim.getStudent().getId(),
                boletim.getDisciplina().getId(),
                boletim.getDisciplina().getTitle(),
                boletim.getBimestre(),
                mediaSugerida,
                boletim.getNotaFinal(),
                boletim.getLancadoEm());
    }

    public static BoletimDTO toDtoSemNotaFinal(Long studentId, Disciplina disciplina, Bimestre bimestre, Float mediaSugerida) {
        return new BoletimDTO(
                null,
                studentId,
                disciplina.getId(),
                disciplina.getTitle(),
                bimestre,
                mediaSugerida,
                null,
                null);
    }
}
