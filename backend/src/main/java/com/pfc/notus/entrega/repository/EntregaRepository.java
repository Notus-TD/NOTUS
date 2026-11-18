package com.pfc.notus.entrega.repository;

import com.pfc.notus.entrega.domain.Entrega;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// ! REFE: Acesso ao banco da tabela tb_entrega
@Repository
public interface EntregaRepository extends JpaRepository<Entrega, Long> {

    // ! REFE: todas as entregas de um aluno
    List<Entrega> findByStudentId(Long studentId);

    // ! REFE: todas as entregas de uma atividade
    List<Entrega> findByAtividadeId(Long atividadeId);

    // ! REFE: a entrega de um aluno em uma atividade (é única)
    Optional<Entrega> findByAtividadeIdAndStudentId(Long atividadeId, Long studentId);

    // ! REFE: a atividade já tem alguma entrega? (bloqueia exclusão da atividade)
    boolean existsByAtividadeId(Long atividadeId);

    @Query("""
            SELECT e FROM Entrega e JOIN e.atividade a
            WHERE (:studentId IS NULL OR e.student.id = :studentId)
              AND EXISTS (SELECT 1 FROM Lecionamento l
                          WHERE l.professor.id = :professorId
                            AND l.turma = a.turma AND l.disciplina = a.disciplina)
            ORDER BY e.id
            """)
    // ! REFE: entregas das atividades que o professor leciona (turma+disciplina); studentId opcional para filtrar um aluno
    List<Entrega> buscarDoProfessor(Long professorId, Long studentId);

    // ! REFE: quantas entregas o aluno tem (usado para checar se pode ser excluído)
    long countByStudentId(Long studentId);
}
