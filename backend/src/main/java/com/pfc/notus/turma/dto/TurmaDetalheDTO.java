package com.pfc.notus.turma.dto;

import com.pfc.notus.lecionamento.dto.LecionamentoDTO;
import com.pfc.notus.user.dto.StudentMinDTO;

import java.util.List;

// ! REFT: Detalhe da turma: dados básicos + lista de alunos + lista de vínculos de professor
public record TurmaDetalheDTO(
        Long id,
        String name,
        String schoolYear,
        List<StudentMinDTO> alunos,
        List<LecionamentoDTO> lecionamentos
) {
}
