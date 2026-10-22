package com.pfc.notus.entrega.mapper;

import com.pfc.notus.entrega.domain.Entrega;
import com.pfc.notus.entrega.dto.EntregaDTO;

public class EntregaMapper {

    public static EntregaDTO toDto(Entrega entrega) {
        return new EntregaDTO(
                entrega.getId(),
                entrega.getStatus(),
                entrega.getAtividade().getId(),
                entrega.getAtividade().getTitle(),
                entrega.getAtividade().getDisciplina().getId(),
                entrega.getAtividade().getBimestre(),
                entrega.getStudent().getId());
    }
}
