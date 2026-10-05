package com.pfc.notus.turma.dto;

import com.pfc.notus.lecionamento.dto.LecionamentoDTO;
import com.pfc.notus.user.dto.StudentMinDTO;

import java.util.List;

public record TurmaDetalheDTO(
        Long id,
        String name,
        String schoolYear,
        List<StudentMinDTO> alunos,
        List<LecionamentoDTO> lecionamentos
) {
}
