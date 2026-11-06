package com.pfc.notus.disciplina.repository;

import com.pfc.notus.disciplina.domain.AulaRegistro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Set;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface AulaRegistroRepository extends JpaRepository<AulaRegistro, Long> {

    boolean existsByTurmaIdAndDisciplinaIdAndData(Long turmaId, Long disciplinaId, LocalDate data);

    @Query("select a.data from AulaRegistro a where a.turma.id = :turmaId and a.disciplina.id = :disciplinaId")
    Set<LocalDate> findDatasByTurmaIdAndDisciplinaId(@Param("turmaId") Long turmaId, @Param("disciplinaId") Long disciplinaId);
}
