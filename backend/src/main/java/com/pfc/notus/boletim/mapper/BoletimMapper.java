package com.pfc.notus.boletim.mapper;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.dto.BoletimDisciplinaDTO;
import com.pfc.notus.disciplina.domain.Disciplina;

import java.util.List;

public class BoletimMapper {

    private static final float NOTA_MAXIMA = 10f;

    public static BoletimDTO toDto(Boletim boletim, Float mediaCalculada, Float pontosAtividades) {
        return new BoletimDTO(
                boletim.getId(),
                boletim.getStudent().getId(),
                boletim.getDisciplina().getId(),
                boletim.getDisciplina().getTitle(),
                boletim.getBimestre(),
                mediaCalculada,
                boletim.getNotaFinal(),
                somarAtividades(boletim.getNotaFinal(), pontosAtividades),
                boletim.getLancadoEm(),
                pontosAtividades);
    }

    public static BoletimDTO toDtoSemNotaFinal(Long studentId, Disciplina disciplina, Bimestre bimestre,
                                               Float mediaCalculada, Float pontosAtividades) {
        return new BoletimDTO(
                null,
                studentId,
                disciplina.getId(),
                disciplina.getTitle(),
                bimestre,
                mediaCalculada,
                null,
                somarAtividades(mediaCalculada, pontosAtividades),
                null,
                pontosAtividades);
    }

    public static BoletimDisciplinaDTO toDisciplinaDto(Disciplina disciplina, List<BoletimDTO> bimestres,
                                                       Float mediaFinal) {
        return new BoletimDisciplinaDTO(
                disciplina.getId(),
                disciplina.getTitle(),
                bimestres,
                mediaFinal,
                null);
    }

    public static BoletimDisciplinaDTO comMediaSala(BoletimDisciplinaDTO disciplina, Float mediaSala) {
        return new BoletimDisciplinaDTO(
                disciplina.disciplinaId(),
                disciplina.disciplinaTitle(),
                disciplina.bimestres(),
                disciplina.mediaFinal(),
                mediaSala);
    }

    private static Float somarAtividades(Float nota, Float pontosAtividades) {
        if (nota == null && pontosAtividades == null) {
            return null;
        }
        float total = (nota == null ? 0f : nota) + (pontosAtividades == null ? 0f : pontosAtividades);
        return Math.min(total, NOTA_MAXIMA);
    }
}
