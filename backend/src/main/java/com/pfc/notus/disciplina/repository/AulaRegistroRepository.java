package com.pfc.notus.disciplina.repository;

import com.pfc.notus.disciplina.domain.AulaRegistro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface AulaRegistroRepository extends JpaRepository<AulaRegistro, Long> {

    boolean existsByDisciplinaIdAndData(Long disciplinaId, LocalDate data);

    long countByDisciplinaId(Long disciplinaId);
}
