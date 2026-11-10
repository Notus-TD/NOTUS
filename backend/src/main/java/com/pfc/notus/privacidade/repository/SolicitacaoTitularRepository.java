package com.pfc.notus.privacidade.repository;

import com.pfc.notus.privacidade.domain.SolicitacaoTitular;
import com.pfc.notus.privacidade.domain.StatusSolicitacao;
import com.pfc.notus.privacidade.domain.TipoSolicitacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SolicitacaoTitularRepository extends JpaRepository<SolicitacaoTitular, Long> {

    @Query("""
            SELECT s FROM SolicitacaoTitular s JOIN FETCH s.solicitante LEFT JOIN FETCH s.aluno
            ORDER BY CASE WHEN s.status = com.pfc.notus.privacidade.domain.StatusSolicitacao.ABERTA THEN 0 ELSE 1 END,
                     s.prazoEm, s.id
            """)
    List<SolicitacaoTitular> listarTodas();

    @Query("""
            SELECT s FROM SolicitacaoTitular s JOIN FETCH s.solicitante LEFT JOIN FETCH s.aluno
            WHERE s.solicitante.id = :solicitanteId
            ORDER BY s.solicitadaEm DESC, s.id DESC
            """)
    List<SolicitacaoTitular> listarDoSolicitante(Long solicitanteId);

    @Query("""
            SELECT COUNT(s) > 0 FROM SolicitacaoTitular s LEFT JOIN s.aluno a
            WHERE s.solicitante.id = :solicitanteId AND s.tipo = :tipo AND s.status = :status
              AND ((:alunoId IS NULL AND a IS NULL) OR a.id = :alunoId)
            """)
    boolean existeAberta(Long solicitanteId, Long alunoId, TipoSolicitacao tipo, StatusSolicitacao status);

    @Query("""
            SELECT s FROM SolicitacaoTitular s JOIN FETCH s.solicitante so LEFT JOIN FETCH s.aluno a
            WHERE s.status = com.pfc.notus.privacidade.domain.StatusSolicitacao.ABERTA
              AND (a.id = :usuarioId OR (a IS NULL AND so.id = :usuarioId))
            ORDER BY s.prazoEm, s.id
            """)
    List<SolicitacaoTitular> listarAbertasDoUsuario(Long usuarioId);
}
