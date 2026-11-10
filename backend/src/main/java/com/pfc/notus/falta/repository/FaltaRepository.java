package com.pfc.notus.falta.repository;

import com.pfc.notus.falta.domain.FaltaDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface FaltaRepository extends JpaRepository<FaltaDomain, Long> {

    List<FaltaDomain> findByAlunoIdAndAnoLetivo(Long alunoId, String anoLetivo);

    List<FaltaDomain> findByAlunoIdInAndAnoLetivo(List<Long> alunoIds, String anoLetivo);

    List<FaltaDomain> findByDisciplinaIdAndAnoLetivo(Long disciplinaId, String anoLetivo);

    List<FaltaDomain> findByAlunoIdInAndDisciplinaIdAndData(Collection<Long> alunoIds, Long disciplinaId, LocalDate data);

    List<FaltaDomain> findByAlunoIdInAndDisciplinaIdAndAnoLetivo(Collection<Long> alunoIds, Long disciplinaId, String anoLetivo);
}
