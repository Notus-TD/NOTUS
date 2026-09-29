package com.pfc.notus.lecionamento.dto;

import java.util.List;

public record TurmaComDisciplinasDTO(
        Long turmaId,
        String turmaName,
        String schoolYear,
        List<DisciplinaResumoDTO> disciplinas
) {
    public record DisciplinaResumoDTO(Long id, String title) {
    }
}
