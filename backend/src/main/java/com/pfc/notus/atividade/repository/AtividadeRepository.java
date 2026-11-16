package com.pfc.notus.atividade.repository;

import com.pfc.notus.atividade.domain.Atividade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// ! REFA: Acesso ao banco da tabela tb_atividade
@Repository
public interface AtividadeRepository extends JpaRepository<Atividade, Long> {

    // ! REFA: atividades de uma turma em um ano letivo, da mais próxima do prazo para a mais distante
    List<Atividade> findByTurmaIdAndAnoLetivoOrderByPrazoAsc(Long turmaId, String anoLetivo);
}
