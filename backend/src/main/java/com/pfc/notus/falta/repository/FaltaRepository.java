package com.pfc.notus.falta.repository;

import com.pfc.notus.falta.domain.FaltaDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaltaRepository extends JpaRepository<FaltaDomain, Long> {

    List<FaltaDomain> findByAlunoId(Long alunoId);

    List<FaltaDomain> findByDisciplinaId(Long disciplinaId);
}
