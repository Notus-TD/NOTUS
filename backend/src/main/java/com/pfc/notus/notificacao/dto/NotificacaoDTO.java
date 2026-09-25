package com.pfc.notus.notificacao.dto;

import com.pfc.notus.notificacao.domain.Notificacao;
import com.pfc.notus.notificacao.domain.StatusNotificacao;
import com.pfc.notus.notificacao.domain.TipoNotificacao;
import com.pfc.notus.notificacao.util.TelefoneUtil;

import java.time.LocalDateTime;

public record NotificacaoDTO(
        Long id,
        TipoNotificacao tipo,
        StatusNotificacao status,
        Long responsavelId,
        String responsavelNome,
        String telefone,
        Long studentId,
        String studentNome,
        String template,
        int tentativas,
        String erro,
        LocalDateTime criadoEm,
        LocalDateTime enviadoEm,
        LocalDateTime proximaTentativaEm
) {
    public static NotificacaoDTO from(Notificacao n) {
        return new NotificacaoDTO(
                n.getId(),
                n.getTipo(),
                n.getStatus(),
                n.getResponsavel().getId(),
                n.getResponsavel().getName(),
                TelefoneUtil.mascarar(n.getResponsavel().getPhone()),
                n.getStudent() == null ? null : n.getStudent().getId(),
                n.getStudent() == null ? null : n.getStudent().getFullName(),
                n.getTemplate(),
                n.getTentativas(),
                n.getErro(),
                n.getCriadoEm(),
                n.getEnviadoEm(),
                n.getProximaTentativaEm()
        );
    }
}
