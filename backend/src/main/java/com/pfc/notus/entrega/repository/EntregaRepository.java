package com.pfc.notus.entrega.repository;

import com.pfc.notus.entrega.domain.Entrega;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EntregaRepository extends JpaRepository<Entrega, Long> {

    List<Entrega> findByStudentId(Long studentId);

    List<Entrega> findByAtividadeId(Long atividadeId);
}
