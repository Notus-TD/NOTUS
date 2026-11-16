package com.pfc.notus.user.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;


// ! REFU: Entidade base da tabela tb_user (herança JOINED): login, senha, termos, ativo, anonimização e MFA; Student/Responsible/Professor estendem
@Entity
@Table(name = "tb_user")
@Inheritance(strategy = InheritanceType.JOINED)
@NoArgsConstructor
public class User implements UserDetails {

    @Id
    @Getter @Setter
    private Long id;

    @JsonIgnore
    @Getter @Setter
    private String password;

    @Getter
    private String email;

    // ! REFU: true até o usuário definir a senha pelo convite
    @Getter @Setter
    private boolean firstLogin = true;

    @Getter @Setter
    private LocalDateTime termsAcceptedAt;

    @Getter
    private LocalDate createdAt;

    // ! REFU: false bloqueia o login (desligado, matrícula cancelada ou anonimizado)
    @Getter @Setter
    private boolean ativo = true;

    @Getter @Setter
    private LocalDateTime anonimizadoEm;

    // ! REFU: MFA: segredo TOTP cifrado, se está ativo e o último passo aceito (evita reuso do código)
    @JsonIgnore
    @Getter @Setter
    private String mfaSegredo;

    @ColumnDefault("false")
    @Getter @Setter
    private boolean mfaAtivo;

    @Getter @Setter
    private Long mfaUltimoPasso;

    @ManyToMany
    @JoinTable(name = "tb_user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    // ! REFU: papéis do usuário (tabela tb_user_role)
    private Set<Role> roles = new HashSet<>();

    // ! REFU: cria com e-mail normalizado e primeiro acesso pendente
    public User(String email) {
        this.email = normalizarEmail(email);
        this.firstLogin = true;
        this.createdAt = LocalDate.now();
    }

    // ! REFU: sempre normaliza (minúsculo, sem espaços)
    public void setEmail(String email) {
        this.email = normalizarEmail(email);
    }

    /**
     * E-mail sempre sem espaços e em minúsculas: "Ana@Escola.com " e "ana@escola.com" são o mesmo usuário.
     * Vazio vira null (aluno pode não ter e-mail).
     */
    /** LGPD: apaga os dados de acesso. Student e Responsible completam com os próprios dados pessoais. */
    // ! REFU: LGPD: apaga e-mail, senha e termos e desativa; subclasses apagam os dados pessoais
    public void anonimizar() {
        this.email = null;
        this.password = null;
        this.termsAcceptedAt = null;
        this.ativo = false;
        this.anonimizadoEm = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
    }

    /** Apaga o MFA: no próximo login o usuário cadastra o autenticador de novo. */
    // ! REFU: zera o MFA: no próximo login cadastra o app de novo
    public void limparMfa() {
        this.mfaSegredo = null;
        this.mfaAtivo = false;
        this.mfaUltimoPasso = null;
    }

    // ! REFU: trim + minúsculo; vazio vira null (aluno pode não ter e-mail)
    public static String normalizarEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    // ! REFU: construtor leve usado no loadUserByUsername
    public User(String username, String password) {
        this.email = username;
        this.password = password;
    }

    // ! REFU: métodos do UserDetails do Spring Security
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // ! REFU: conta habilitada = ativo
    @Override
    public boolean isEnabled() {
        return this.ativo;
    }

    // ! REFU: adiciona um papel
    public void addRole(Role role) {
        roles.add(role);
    }

    // ! REFU: tem esse papel? (ex: ROLE_ADMIN)
    public boolean hasRole(String roleName) {
        for (Role role : roles) {
            if (role.getAuthority().equals(roleName)) {
                return true;
            }
        }
        return false;
    }
}
