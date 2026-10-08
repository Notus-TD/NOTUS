package com.pfc.notus.boletim.repository;


import com.pfc.notus.boletim.domain.Boletim;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoletimRepository extends JpaRepository<Boletim, Long> {

    List<Boletim> findByStudentId(Long studentId);

    Page<Boletim> findByStudentId(Long studentId, Pageable pageable);

    List<Boletim> findByStudentIdAndPeriod(Long studentId, String period);

    Page<Boletim> findByStudentIdAndPeriod(Long studentId, String period, Pageable pageable);

    List<Boletim> findByPeriod(String period);

    Page<Boletim> findByPeriod(String period, Pageable pageable);

    List<Boletim> findByStatus(String status);

    Page<Boletim> findByStatus(String status, Pageable pageable);

    List<Boletim> findByStudentIdAndStatus(Long studentId, String status);

    Page<Boletim> findByStudentIdAndStatus(Long studentId, String status, Pageable pageable);
}
