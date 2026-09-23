package com.pfc.notus.lecionamento.repository;

import com.pfc.notus.lecionamento.domain.Lecionamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LecionamentoRepository extends JpaRepository<Lecionamento, Long> {

    List<Lecionamento> findByProfessorId(Long professorId);

    boolean existsByTurmaIdAndDisciplinaIdAndProfessorId(Long turmaId, Long disciplinaId, Long professorId);

    boolean existsByProfessorIdAndDisciplinaIdNot(Long professorId, Long disciplinaId);
}
