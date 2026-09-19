package com.pfc.notus.boletim.repository;


import com.pfc.notus.boletim.domain.Boletim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoletimRepository extends JpaRepository<Boletim, Long> {

    List<Boletim> findByStudentId(Long studentId);
}
