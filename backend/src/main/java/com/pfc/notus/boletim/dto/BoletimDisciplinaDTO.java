package com.pfc.notus.boletim.dto;

import java.util.List;

public record BoletimDisciplinaDTO(
        Long disciplinaId,
        String disciplinaTitle,
        List<BoletimDTO> bimestres,
        Float mediaFinal,
        Float mediaSala
) {
}
