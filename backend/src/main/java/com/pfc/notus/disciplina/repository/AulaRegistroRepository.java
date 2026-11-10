package com.pfc.notus.disciplina.repository;

import com.pfc.notus.disciplina.domain.AulaRegistro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AulaRegistroRepository extends JpaRepository<AulaRegistro, Long> {

    Optional<AulaRegistro> findByTurmaIdAndDisciplinaIdAndDataAndAnoLetivo(Long turmaId, Long disciplinaId, LocalDate data, String anoLetivo);

    List<AulaRegistro> findByTurmaIdAndDisciplinaIdAndAnoLetivo(Long turmaId, Long disciplinaId, String anoLetivo);
}
