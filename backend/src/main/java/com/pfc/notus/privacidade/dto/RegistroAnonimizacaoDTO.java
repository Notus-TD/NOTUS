package com.pfc.notus.privacidade.dto;

import com.pfc.notus.privacidade.domain.MotivoAnonimizacao;
import com.pfc.notus.privacidade.domain.RegistroAnonimizacao;

import java.time.LocalDateTime;

// ! REFP: Um registro do histórico de anonimização na API
public record RegistroAnonimizacaoDTO(
        Long id,
        Long usuarioId,
        String perfil,
        Long matricula,
        MotivoAnonimizacao motivo,
        String motivoDescricao,
        String detalhe,
        String executadoPor,
        LocalDateTime executadoEm
) {
    // ! REFP: converte a entidade incluindo a descrição do motivo
    public static RegistroAnonimizacaoDTO from(RegistroAnonimizacao r) {
        return new RegistroAnonimizacaoDTO(r.getId(), r.getUsuarioId(), r.getPerfil(), r.getMatricula(), r.getMotivo(),
                r.getMotivo().getDescricao(), r.getDetalhe(), r.getExecutadoPor(), r.getExecutadoEm());
    }
}
