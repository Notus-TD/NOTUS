package com.pfc.notus.notificacao.domain;

import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_notificacao",
        indexes = {
                @Index(name = "idx_notificacao_status_proxima", columnList = "status, proxima_tentativa_em"),
                @Index(name = "idx_notificacao_provider_id", columnList = "provider_message_id")
        })
@NoArgsConstructor
public class Notificacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Getter @Setter
    private TipoNotificacao tipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsavel_id", nullable = false)
    @Getter @Setter
    private Responsible responsavel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    @Getter @Setter
    private Student student;

    @Getter @Setter
    private String referenciaTipo;

    @Getter @Setter
    private Long referenciaId;

    @Column(nullable = false, unique = true)
    @Getter @Setter
    private String chaveIdempotencia;

    @Column(nullable = false)
    @Getter @Setter
    private String template;

    @Column(length = 2000)
    @Getter @Setter
    private String variaveis;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Getter @Setter
    private StatusNotificacao status;

    @Getter @Setter
    private int tentativas;

    @Getter @Setter
    private LocalDateTime proximaTentativaEm;

    @Getter @Setter
    private String providerMessageId;

    @Column(length = 500)
    @Getter @Setter
    private String erro;

    @Getter @Setter
    private LocalDateTime criadoEm;

    @Getter @Setter
    private LocalDateTime enviadoEm;

    public Notificacao(TipoNotificacao tipo, Responsible responsavel, Student student,
                       String referenciaTipo, Long referenciaId, String chaveIdempotencia,
                       String template, String variaveis) {
        this.tipo = tipo;
        this.responsavel = responsavel;
        this.student = student;
        this.referenciaTipo = referenciaTipo;
        this.referenciaId = referenciaId;
        this.chaveIdempotencia = chaveIdempotencia;
        this.template = template;
        this.variaveis = variaveis;
        this.status = StatusNotificacao.PENDENTE;
        this.tentativas = 0;
        this.criadoEm = LocalDateTime.now();
        this.proximaTentativaEm = this.criadoEm;
    }
}
