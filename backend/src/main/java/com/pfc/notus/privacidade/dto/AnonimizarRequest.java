package com.pfc.notus.privacidade.dto;

import com.pfc.notus.privacidade.domain.MotivoAnonimizacao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AnonimizarRequest(
        @NotBlank String confirmacao,
        @NotNull MotivoAnonimizacao motivo,
        @Size(max = 500) String detalhe,
        Long solicitacaoId
) {
}
