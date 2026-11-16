package com.pfc.notus.user.repository;

import com.pfc.notus.user.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// ! REFU: Acesso ao banco da tabela tb_role (papéis ADMIN, PROFESSOR, ALUNO, RESPONSAVEL)
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    // ! REFU: papel pelo nome (ex: ROLE_ALUNO)
    Optional<Role> findByAuthority(String authority);
}

