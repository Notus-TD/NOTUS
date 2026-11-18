package com.pfc.notus.disciplina.repository;

import com.pfc.notus.disciplina.domain.AulaRegistro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

// ! REFD: Acesso ao banco da tabela tb_aula_registro (aulas dadas, base para calcular frequência)
@Repository
public interface AulaRegistroRepository extends JpaRepository<AulaRegistro, Long> {

    // ! REFD: o registro de aula de um dia específico (turma + disciplina + data)
    Optional<AulaRegistro> findByTurmaIdAndDisciplinaIdAndDataAndAnoLetivo(Long turmaId, Long disciplinaId, LocalDate data, String anoLetivo);

    // ! REFD: todas as aulas da disciplina na turma no ano
    List<AulaRegistro> findByTurmaIdAndDisciplinaIdAndAnoLetivo(Long turmaId, Long disciplinaId, String anoLetivo);
}
