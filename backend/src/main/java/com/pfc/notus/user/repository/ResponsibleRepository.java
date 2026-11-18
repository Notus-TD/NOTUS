package com.pfc.notus.user.repository;

import com.pfc.notus.user.domain.Responsible;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// ! REFU: Acesso ao banco da tabela tb_responsible
@Repository
public interface ResponsibleRepository extends JpaRepository<Responsible, Long> {

    // ! REFU: responsável pelo e-mail (reaproveitado no cadastro de irmãos)
    Optional<Responsible> findByEmail(String email);
}

