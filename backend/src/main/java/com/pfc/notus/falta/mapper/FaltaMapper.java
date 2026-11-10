package com.pfc.notus.falta.mapper;

import com.pfc.notus.falta.domain.FaltaDomain;
import com.pfc.notus.falta.dto.ChamadaAlunoDTO;
import com.pfc.notus.falta.dto.ChamadaDTO;
import com.pfc.notus.falta.dto.FaltaDTO;
import com.pfc.notus.user.domain.Student;

import java.time.LocalDate;
import java.util.List;

public class FaltaMapper {

    public static FaltaDTO toDto(FaltaDomain falta) {
        return new FaltaDTO(
                falta.getId(),
                falta.getData(),
                falta.getQuantidade(),
                falta.getRegistradoEm(),
                falta.getAluno().getId(),
                falta.getDisciplina().getId(),
                falta.getRegistradoPor().getId());
    }

    public static ChamadaAlunoDTO toChamadaAlunoDto(Student aluno, int faltasNoDia, int totalFaltas) {
        return new ChamadaAlunoDTO(aluno.getId(), aluno.getFullName(), aluno.getMatricula(), faltasNoDia, totalFaltas);
    }

    public static ChamadaDTO toChamadaDto(Long turmaId, Long disciplinaId, LocalDate data, Integer aulas,
                                          List<ChamadaAlunoDTO> alunos, String bloqueio) {
        return new ChamadaDTO(turmaId, disciplinaId, data, aulas, alunos, bloqueio);
    }
}
