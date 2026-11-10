package com.pfc.notus.calendario.repository;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.calendario.domain.PeriodoLetivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PeriodoLetivoRepository extends JpaRepository<PeriodoLetivo, Long> {

    List<PeriodoLetivo> findByAnoLetivoOrderByInicio(String anoLetivo);

    Optional<PeriodoLetivo> findByAnoLetivoAndBimestre(String anoLetivo, Bimestre bimestre);
}
