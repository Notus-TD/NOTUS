package com.pfc.notus.falta.repository;

import com.pfc.notus.falta.domain.FaltaDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaltaRepository extends JpaRepository<FaltaDomain, Long> {

    List<FaltaDomain> findByAlunoIdAndAnoLetivo(Long alunoId, String anoLetivo);

    List<FaltaDomain> findByAlunoIdInAndAnoLetivo(List<Long> alunoIds, String anoLetivo);

    List<FaltaDomain> findByDisciplinaIdAndAnoLetivo(Long disciplinaId, String anoLetivo);
}
