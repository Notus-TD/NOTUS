package com.pfc.notus.privacidade.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_registro_anonimizacao")
@NoArgsConstructor
@Getter
public class RegistroAnonimizacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long usuarioId;

    @Column(nullable = false, length = 20)
    private String perfil;

    private Long matricula;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MotivoAnonimizacao motivo;

    @Column(length = 500)
    private String detalhe;

    private Long solicitacaoId;

    @Column(nullable = false)
    private String executadoPor;

    @Column(nullable = false)
    private LocalDateTime executadoEm;

    public RegistroAnonimizacao(Long usuarioId, String perfil, Long matricula, MotivoAnonimizacao motivo, String detalhe,
                                Long solicitacaoId, String executadoPor, LocalDateTime executadoEm) {
        this.usuarioId = usuarioId;
        this.perfil = perfil;
        this.matricula = matricula;
        this.motivo = motivo;
        this.detalhe = detalhe;
        this.solicitacaoId = solicitacaoId;
        this.executadoPor = executadoPor;
        this.executadoEm = executadoEm;
    }
}
