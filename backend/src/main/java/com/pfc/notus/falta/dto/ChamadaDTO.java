package com.pfc.notus.falta.dto;

import java.time.LocalDate;
import java.util.List;

// ! REFF: Resposta da chamada: turma, disciplina, data, quantas aulas, uma linha por aluno e o motivo se o dia estiver bloqueado
public record ChamadaDTO(
        Long turmaId,
        Long disciplinaId,
        LocalDate data,
        Integer aulas,
        List<ChamadaAlunoDTO> alunos,
        String bloqueio
) {
}
