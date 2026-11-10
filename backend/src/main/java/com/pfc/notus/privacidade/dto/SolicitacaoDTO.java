package com.pfc.notus.privacidade.dto;

import com.pfc.notus.privacidade.domain.SolicitacaoTitular;
import com.pfc.notus.privacidade.domain.StatusSolicitacao;
import com.pfc.notus.privacidade.domain.TipoSolicitacao;
import com.pfc.notus.user.domain.Student;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SolicitacaoDTO(
        Long id,
        TipoSolicitacao tipo,
        StatusSolicitacao status,
        Long solicitanteId,
        String solicitanteNome,
        Long alunoId,
        String alunoNome,
        String detalhe,
        LocalDateTime solicitadaEm,
        LocalDate prazoEm,
        boolean atrasada,
        LocalDateTime respondidaEm,
        String resposta
) {
    public static SolicitacaoDTO from(SolicitacaoTitular s, LocalDate hoje) {
        Student aluno = s.getAluno();
        return new SolicitacaoDTO(
                s.getId(), s.getTipo(), s.getStatus(),
                s.getSolicitante().getId(), s.getSolicitante().getName(),
                aluno == null ? null : aluno.getId(),
                aluno == null ? null : aluno.getFullName(),
                s.getDetalhe(), s.getSolicitadaEm(), s.getPrazoEm(),
                s.aberta() && hoje.isAfter(s.getPrazoEm()),
                s.getRespondidaEm(), s.getResposta()
        );
    }
}
