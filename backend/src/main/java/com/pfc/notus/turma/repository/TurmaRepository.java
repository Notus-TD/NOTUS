package com.pfc.notus.turma.repository;


import com.pfc.notus.turma.domain.Turma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TurmaRepository extends JpaRepository<Turma, Long> {

    boolean existsByNameAndSchoolYear(String name, String schoolYear);

    boolean existsByNameAndSchoolYearAndIdNot(String name, String schoolYear, Long id);
}
