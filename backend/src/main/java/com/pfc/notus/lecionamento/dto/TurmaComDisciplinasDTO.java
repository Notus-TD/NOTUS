package com.pfc.notus.lecionamento.dto;

import java.util.List;

// ! REFL: Uma turma do professor com a lista das disciplinas que ele dá nela (tela 'minhas turmas')
public record TurmaComDisciplinasDTO(
        Long turmaId,
        String turmaName,
        String schoolYear,
        List<DisciplinaResumoDTO> disciplinas
) {
    // ! REFL: só id e título da disciplina
    public record DisciplinaResumoDTO(Long id, String title) {
    }
}
