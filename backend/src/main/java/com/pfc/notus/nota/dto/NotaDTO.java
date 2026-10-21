package com.pfc.notus.nota.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Na criação/edição o cliente manda nota, período, boletim e disciplina; disciplinaTitle é só de resposta. */
public record NotaDTO(Long id, @NotNull @DecimalMin("0.0") @DecimalMax("10.0") Float rate, @NotBlank String period, @NotNull Long boletimId, @NotNull Long disciplinaId,
                      String disciplinaTitle) {

    public NotaDTO(Long id, Float rate, String period, Long boletimId, Long disciplinaId) {
        this(id, rate, period, boletimId, disciplinaId, null);
    }
}
