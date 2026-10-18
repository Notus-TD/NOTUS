package com.pfc.notus.atividade.repository;

import com.pfc.notus.atividade.domain.Atividade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AtividadeRepository extends JpaRepository<Atividade, Long> {

    List<Atividade> findByTurmaIdOrderByPrazoAsc(Long turmaId);
}
