package com.pfc.notus.falta.dto;

import java.time.LocalDate;
import java.util.List;

public record ChamadaDTO(
        Long turmaId,
        Long disciplinaId,
        LocalDate data,
        Integer aulas,
        List<ChamadaAlunoDTO> alunos,
        String bloqueio
) {
}
