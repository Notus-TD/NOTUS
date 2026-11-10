package com.pfc.notus.privacidade.dto;

import com.pfc.notus.privacidade.domain.TipoSolicitacao;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SolicitacaoRequest(
        @NotNull TipoSolicitacao tipo,
        Long alunoId,
        @Size(max = 1000) String detalhe
) {
}
