package com.pfc.notus.nota.repository;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.nota.domain.Nota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotaRepository extends JpaRepository<Nota, Long> {

    List<Nota> findByStudentIdOrderByIdAsc(Long studentId);

    List<Nota> findByStudentIdAndDisciplinaIdAndBimestre(Long studentId, Long disciplinaId, Bimestre bimestre);
}
