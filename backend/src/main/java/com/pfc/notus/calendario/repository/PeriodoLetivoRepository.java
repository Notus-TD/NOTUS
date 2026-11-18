package com.pfc.notus.calendario.repository;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.calendario.domain.PeriodoLetivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// ! REFCAL: Acesso ao banco da tabela tb_periodo_letivo (datas dos bimestres)
@Repository
public interface PeriodoLetivoRepository extends JpaRepository<PeriodoLetivo, Long> {

    // ! REFCAL: os bimestres de um ano em ordem de data
    List<PeriodoLetivo> findByAnoLetivoOrderByInicio(String anoLetivo);

    // ! REFCAL: um bimestre específico de um ano
    Optional<PeriodoLetivo> findByAnoLetivoAndBimestre(String anoLetivo, Bimestre bimestre);
}
