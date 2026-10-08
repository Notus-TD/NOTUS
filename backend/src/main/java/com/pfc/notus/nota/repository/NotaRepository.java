package com.pfc.notus.nota.repository;


import com.pfc.notus.nota.domain.Nota;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotaRepository extends JpaRepository<Nota, Long> {

    List<Nota> findByBoletimId(Long boletimId);

    Page<Nota> findByBoletimId(Long boletimId, Pageable pageable);

    List<Nota> findByBoletimIdAndPeriod(Long boletimId, String period);

    Page<Nota> findByBoletimIdAndPeriod(Long boletimId, String period, Pageable pageable);

    List<Nota> findByDisciplinaId(Long disciplinaId);

    Page<Nota> findByDisciplinaId(Long disciplinaId, Pageable pageable);

    List<Nota> findByDisciplinaIdAndPeriod(Long disciplinaId, String period);

    Page<Nota> findByDisciplinaIdAndPeriod(Long disciplinaId, String period, Pageable pageable);
}
