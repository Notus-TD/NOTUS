package com.pfc.notus.user.repository;

import com.pfc.notus.user.domain.Professor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// ! REFU: Acesso ao banco da tabela tb_professor
@Repository
public interface ProfessorRepository extends JpaRepository<Professor, Long> {

    // ! REFU: professor pelo e-mail
    Optional<Professor> findByEmail(String email);
}
