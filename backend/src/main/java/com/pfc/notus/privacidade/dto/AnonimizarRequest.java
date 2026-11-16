package com.pfc.notus.privacidade.dto;

import com.pfc.notus.privacidade.domain.MotivoAnonimizacao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// ! REFP: Corpo do PUT anonimizar: texto de confirmação, motivo e detalhe (obrigatório para 'Outro' e 'Pedido do titular')
public record AnonimizarRequest(
        @NotBlank String confirmacao,
        @NotNull MotivoAnonimizacao motivo,
        @Size(max = 500) String detalhe
) {
}
