package com.pfc.notus.notificacao.repository;

import com.pfc.notus.notificacao.domain.Notificacao;
import com.pfc.notus.notificacao.domain.StatusNotificacao;
import com.pfc.notus.notificacao.domain.TipoNotificacao;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {

    boolean existsByChaveIdempotencia(String chaveIdempotencia);

    @Query("""
            SELECT n.id FROM Notificacao n
            WHERE n.status IN (:pendente, :enviando)
              AND n.proximaTentativaEm <= :agora
            ORDER BY n.proximaTentativaEm, n.id
            """)
    List<Long> findIdsProntosParaEnvio(StatusNotificacao pendente, StatusNotificacao enviando,
                                       LocalDateTime agora, Pageable pageable);

    @Modifying
    @Query("""
            UPDATE Notificacao n SET n.status = :cancelada, n.erro = :motivo
            WHERE n.status = :pendente
              AND n.referenciaTipo = :referenciaTipo AND n.referenciaId = :referenciaId
            """)
    int cancelarPorReferencia(StatusNotificacao pendente, StatusNotificacao cancelada,
                              String referenciaTipo, Long referenciaId, String motivo);

    @Modifying
    @Query("""
            UPDATE Notificacao n SET n.status = :cancelada, n.erro = :motivo
            WHERE n.status = :pendente AND n.responsavel.id = :responsavelId
            """)
    int cancelarPorResponsavel(StatusNotificacao pendente, StatusNotificacao cancelada,
                               Long responsavelId, String motivo);

    @Modifying
    @Query("""
            UPDATE Notificacao n SET n.status = :cancelada, n.erro = :motivo
            WHERE n.status = :pendente AND n.student.id = :studentId
            """)
    int cancelarPorAluno(StatusNotificacao pendente, StatusNotificacao cancelada,
                         Long studentId, String motivo);

    @Query("""
            SELECT n FROM Notificacao n JOIN FETCH n.responsavel r LEFT JOIN FETCH n.student s
            WHERE (:tipo IS NULL OR n.tipo = :tipo)
              AND (:status IS NULL OR n.status = :status)
              AND (:responsavelId IS NULL OR r.id = :responsavelId)
              AND n.criadoEm >= :de AND n.criadoEm < :ate
            ORDER BY n.criadoEm DESC, n.id DESC
            """)
    List<Notificacao> buscar(TipoNotificacao tipo, StatusNotificacao status, Long responsavelId,
                             LocalDateTime de, LocalDateTime ate);
}
