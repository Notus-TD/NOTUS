package com.pfc.notus.entrega.repository;

import com.pfc.notus.entrega.domain.Entrega;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EntregaRepository extends JpaRepository<Entrega, Long> {

    List<Entrega> findByStudentId(Long studentId);

    List<Entrega> findByAtividadeId(Long atividadeId);

    boolean existsByAtividadeId(Long atividadeId);

    /** Entregas das atividades cuja turma e disciplina o professor leciona (studentId opcional). */
    @Query("""
            SELECT e FROM Entrega e JOIN e.atividade a
            WHERE (:studentId IS NULL OR e.student.id = :studentId)
              AND EXISTS (SELECT 1 FROM Lecionamento l
                          WHERE l.professor.id = :professorId
                            AND l.turma = a.turma AND l.disciplina = a.disciplina)
            ORDER BY e.id
            """)
    List<Entrega> buscarDoProfessor(Long professorId, Long studentId);
}
