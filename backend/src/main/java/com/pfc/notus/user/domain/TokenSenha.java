package com.pfc.notus.user.domain;

import com.pfc.notus.user.domain.enums.TipoTokenSenha;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Link de uso único para definir a senha (convite ou redefinição).
 * Só o hash SHA-256 do token fica no banco; o token em texto vai apenas no e-mail.
 */
@Entity
@Table(name = "tb_token_senha", indexes = @Index(name = "ix_token_senha_user", columnList = "user_id"))
@NoArgsConstructor
@Getter
public class TokenSenha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoTokenSenha tipo;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private LocalDateTime criadoEm;

    @Column(nullable = false)
    private LocalDateTime expiraEm;

    /** Preenchido quando o link é usado ou quando um link mais novo do mesmo usuário o substitui. */
    @Setter
    private LocalDateTime encerradoEm;

    public TokenSenha(User user, TipoTokenSenha tipo, String tokenHash, LocalDateTime criadoEm) {
        this.user = user;
        this.tipo = tipo;
        this.tokenHash = tokenHash;
        this.criadoEm = criadoEm;
        this.expiraEm = criadoEm.plus(tipo.getValidade());
    }

    public boolean isValido(LocalDateTime agora) {
        return encerradoEm == null && agora.isBefore(expiraEm);
    }
}
