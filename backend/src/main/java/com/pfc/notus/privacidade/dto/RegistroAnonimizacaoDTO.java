package com.pfc.notus.privacidade.dto;

import com.pfc.notus.privacidade.domain.MotivoAnonimizacao;
import com.pfc.notus.privacidade.domain.RegistroAnonimizacao;

import java.time.LocalDateTime;

public record RegistroAnonimizacaoDTO(
        Long id,
        Long usuarioId,
        String perfil,
        Long matricula,
        MotivoAnonimizacao motivo,
        String motivoDescricao,
        String detalhe,
        Long solicitacaoId,
        String executadoPor,
        LocalDateTime executadoEm
) {
    public static RegistroAnonimizacaoDTO from(RegistroAnonimizacao r) {
        return new RegistroAnonimizacaoDTO(r.getId(), r.getUsuarioId(), r.getPerfil(), r.getMatricula(), r.getMotivo(),
                r.getMotivo().getDescricao(), r.getDetalhe(), r.getSolicitacaoId(), r.getExecutadoPor(), r.getExecutadoEm());
    }
}
