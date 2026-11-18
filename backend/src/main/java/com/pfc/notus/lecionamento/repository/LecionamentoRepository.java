package com.pfc.notus.lecionamento.repository;

import com.pfc.notus.lecionamento.domain.Lecionamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// ! REFL: Acesso ao banco da tabela tb_lecionamento (vínculo professor x turma x disciplina)
@Repository
public interface LecionamentoRepository extends JpaRepository<Lecionamento, Long> {

    // ! REFL: todos os vínculos de um professor (suas turmas e disciplinas)
    List<Lecionamento> findByProfessorId(Long professorId);

    // ! REFL: apaga todos os vínculos do professor (usado ao desligar professor)
    long deleteByProfessorId(Long professorId);

    // ! REFL: a disciplina é dada nessa turma por alguém?
    boolean existsByTurmaIdAndDisciplinaId(Long turmaId, Long disciplinaId);

    // ! REFL: a disciplina tem algum professor vinculado? (bloqueia exclusão da disciplina)
    boolean existsByDisciplinaId(Long disciplinaId);

    // ! REFL: o professor dá alguma aula nessa turma? (usado no recado do professor)
    boolean existsByProfessorIdAndTurmaId(Long professorId, Long turmaId);

    // ! REFL: quantos professores dão essa disciplina nessa turma (limite de 2)
    long countByTurmaIdAndDisciplinaId(Long turmaId, Long disciplinaId);

    // ! REFL: o professor dá exatamente essa disciplina nessa turma? (base das permissões de nota, falta, atividade)
    boolean existsByProfessorIdAndTurmaIdAndDisciplinaId(Long professorId, Long turmaId, Long disciplinaId);
}
