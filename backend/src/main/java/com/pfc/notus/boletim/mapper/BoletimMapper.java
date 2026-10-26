package com.pfc.notus.boletim.mapper;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.dto.BoletimDisciplinaDTO;
import com.pfc.notus.disciplina.domain.Disciplina;

import java.util.List;

public class BoletimMapper {

    public static BoletimDTO toDto(Boletim boletim, Float mediaCalculada) {
        return new BoletimDTO(
                boletim.getId(),
                boletim.getStudent().getId(),
                boletim.getDisciplina().getId(),
                boletim.getDisciplina().getTitle(),
                boletim.getBimestre(),
                mediaCalculada,
                boletim.getNotaFinal(),
                boletim.getNotaFinal(),
                boletim.getLancadoEm());
    }

    public static BoletimDTO toDtoSemNotaFinal(Long studentId, Disciplina disciplina, Bimestre bimestre, Float mediaCalculada) {
        return new BoletimDTO(
                null,
                studentId,
                disciplina.getId(),
                disciplina.getTitle(),
                bimestre,
                mediaCalculada,
                null,
                mediaCalculada,
                null);
    }

    public static BoletimDisciplinaDTO toDisciplinaDto(Disciplina disciplina, List<BoletimDTO> bimestres,
                                                       Float mediaPrimeiroSemestre, Float mediaSegundoSemestre,
                                                       Float mediaAnual) {
        return new BoletimDisciplinaDTO(
                disciplina.getId(),
                disciplina.getTitle(),
                bimestres,
                mediaPrimeiroSemestre,
                mediaSegundoSemestre,
                mediaAnual);
    }
}
