package com.pfc.notus.turma.repository;


import com.pfc.notus.turma.domain.Turma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// ! REFT: Acesso ao banco da tabela tb_turma
@Repository
public interface TurmaRepository extends JpaRepository<Turma, Long> {

    // ! REFT: já existe turma com esse nome nesse ano? (create)
    boolean existsByNameAndSchoolYear(String name, String schoolYear);

    // ! REFT: outra turma já usa esse nome nesse ano? (update)
    boolean existsByNameAndSchoolYearAndIdNot(String name, String schoolYear, Long id);
}
