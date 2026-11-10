package com.pfc.notus.privacidade.dto;

import com.pfc.notus.privacidade.domain.StatusSolicitacao;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RespostaSolicitacaoRequest(
        @NotNull StatusSolicitacao status,
        @Size(max = 1000) String resposta
) {
}
