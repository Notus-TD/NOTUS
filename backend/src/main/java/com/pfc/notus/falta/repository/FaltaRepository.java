package com.pfc.notus.falta.repository;

import com.pfc.notus.falta.domain.FaltaDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FaltaRepository extends JpaRepository<FaltaDomain, Long> {

}
