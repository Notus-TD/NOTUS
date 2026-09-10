package com.pfc.notus.user.repository;

import com.pfc.notus.user.domain.Responsible;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResponsibleRepository extends JpaRepository<Responsible, Long> {

    Optional<Responsible> findByCpf(String cpf);
}

