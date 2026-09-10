package com.pfc.notus.presenca.repository;

import com.pfc.notus.presenca.domain.Presenca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PresencaRepository extends JpaRepository<Presenca, Long> {

    List<Presenca> findByStudentId(Long studentId);

    List<Presenca> findByDisciplinaId(Long disciplinaId);
}
