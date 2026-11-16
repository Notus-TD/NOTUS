package com.pfc.notus.boletim.dto;

import java.util.List;

// ! REFB: Uma disciplina no boletim: lista dos bimestres e a média final do ano
public record BoletimDisciplinaDTO(
        Long disciplinaId,
        String disciplinaTitle,
        List<BoletimDTO> bimestres,
        Float mediaFinal
) {
}
