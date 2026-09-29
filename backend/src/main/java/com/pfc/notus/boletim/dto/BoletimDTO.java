package com.pfc.notus.boletim.dto;

import com.pfc.notus.boletim.domain.SituacaoBoletim;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record BoletimDTO (Long id, @NotBlank String period, @NotNull Float finalAverage, @NotBlank String status, @NotNull Long studentId,
                          SituacaoBoletim situacao, LocalDateTime fechadoEm) {
}
