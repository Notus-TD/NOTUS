package com.pfc.notus.boletim.repository;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.boletim.domain.Boletim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoletimRepository extends JpaRepository<Boletim, Long> {

    List<Boletim> findByStudentIdAndAnoLetivo(Long studentId, String anoLetivo);

    Optional<Boletim> findByStudentIdAndDisciplinaIdAndBimestreAndAnoLetivo(Long studentId, Long disciplinaId, Bimestre bimestre, String anoLetivo);
}
