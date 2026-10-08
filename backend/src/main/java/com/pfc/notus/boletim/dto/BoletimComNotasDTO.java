package com.pfc.notus.boletim.dto;

import com.pfc.notus.boletim.domain.SituacaoBoletim;
import com.pfc.notus.nota.dto.NotaDTO;

import java.time.LocalDateTime;
import java.util.List;

public record BoletimComNotasDTO(
    Long id,
    String period,
    Float finalAverage,
    String status,
    Long studentId,
    SituacaoBoletim situacao,
    LocalDateTime fechadoEm,
    List<NotaDTO> notas
) {
}
