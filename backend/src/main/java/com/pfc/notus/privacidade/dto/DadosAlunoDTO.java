package com.pfc.notus.privacidade.dto;

import com.pfc.notus.atividade.dto.AtividadeDTO;
import com.pfc.notus.boletim.dto.BoletimDisciplinaDTO;
import com.pfc.notus.falta.dto.FaltaDTO;
import com.pfc.notus.user.dto.StudentDetalheDTO;

import java.util.List;

public record DadosAlunoDTO(
        StudentDetalheDTO cadastro,
        List<BoletimDisciplinaDTO> boletim,
        List<FaltaDTO> faltas,
        List<AtividadeDTO> atividades
) {
}
