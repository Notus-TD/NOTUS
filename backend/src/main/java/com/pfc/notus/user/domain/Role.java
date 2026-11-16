package com.pfc.notus.user.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;

// ! REFU: Entidade da tabela tb_role: um papel (ROLE_ADMIN, ROLE_PROFESSOR, ROLE_ALUNO, ROLE_RESPONSAVEL)
@Entity
@Table(name = "tb_role")
@NoArgsConstructor
@AllArgsConstructor
public class Role implements GrantedAuthority  {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Getter @Setter
    private String authority;

    // ! REFU: nome do papel para o Spring Security
    @Override
    public String getAuthority() {
        return authority;
    }
}
