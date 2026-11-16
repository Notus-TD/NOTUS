package com.pfc.notus.falta.dto;

import com.pfc.notus.falta.domain.FaltaDomain;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record FaltaDTO(
        Long id,
        @NotNull LocalDate data,
        @NotNull @Positive Integer quantidade,
        LocalDateTime registradoEm,
        @NotNull Long studentId,
        @NotNull Long disciplinaId,
        @NotNull Long registradoPorId
) {
    public static FaltaDTO from(FaltaDomain f) {
        return new FaltaDTO(f.getId(), f.getData(), f.getQuantidade(), f.getRegistradoEm(), f.getAluno().getId(),
                f.getDisciplina().getId(), f.getRegistradoPor().getId());
    }
}
