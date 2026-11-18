package com.pfc.notus.user.domain;

import com.pfc.notus.user.domain.enums.TipoTokenSenha;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// ! REFU: Entidade da tabela tb_token_senha: link de convite ou redefinição de senha, guardado como hash com validade
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

    // ! REFU: preenchido quando o link foi usado ou invalidado
    @Setter
    private LocalDateTime encerradoEm;

    // ! REFU: cria calculando a expiração pelo tipo (7 dias ou 1 hora)
    public TokenSenha(User user, TipoTokenSenha tipo, String tokenHash, LocalDateTime criadoEm) {
        this.user = user;
        this.tipo = tipo;
        this.tokenHash = tokenHash;
        this.criadoEm = criadoEm;
        this.expiraEm = criadoEm.plus(tipo.getValidade());
    }

    // ! REFU: não foi encerrado e ainda não expirou
    public boolean isValido(LocalDateTime agora) {
        return encerradoEm == null && agora.isBefore(expiraEm);
    }
}
