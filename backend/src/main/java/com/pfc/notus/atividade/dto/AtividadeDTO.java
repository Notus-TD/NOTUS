package com.pfc.notus.atividade.dto;

import com.pfc.notus.boletim.domain.Bimestre;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

// ! REFA: Dados da atividade que vão e voltam da API; title, content, bimestre, prazo e turmaId são obrigatórios
public record AtividadeDTO(
        Long id,
        @NotBlank String title,
        @NotBlank String content,
        @NotNull Bimestre bimestre,
        @NotNull LocalDate prazo,
        @NotNull Long turmaId,
        Long disciplinaId,
        String turmaName,
        String disciplinaTitle,
        LocalDateTime publicadaEm,
        Boolean entregue,
        @DecimalMin(value = "0.0", inclusive = false) @DecimalMax("10.0") Float pontos
) {
}
