package com.pfc.notus.privacidade.domain;

import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_solicitacao_titular")
@NoArgsConstructor
@Getter
public class SolicitacaoTitular {

    public static final int PRAZO_DIAS = 15;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoSolicitacao tipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitante_id", nullable = false)
    private Responsible solicitante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aluno_id")
    private Student aluno;

    @Column(length = 1000)
    private String detalhe;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusSolicitacao status;

    @Column(nullable = false)
    private LocalDateTime solicitadaEm;

    @Column(nullable = false)
    private LocalDate prazoEm;

    private LocalDateTime respondidaEm;

    @Column(length = 1000)
    private String resposta;

    private String respondidaPor;

    public SolicitacaoTitular(TipoSolicitacao tipo, Responsible solicitante, Student aluno, String detalhe,
                              LocalDateTime solicitadaEm) {
        this.tipo = tipo;
        this.solicitante = solicitante;
        this.aluno = aluno;
        this.detalhe = detalhe;
        this.status = StatusSolicitacao.ABERTA;
        this.solicitadaEm = solicitadaEm;
        this.prazoEm = solicitadaEm.toLocalDate().plusDays(PRAZO_DIAS);
    }

    public boolean aberta() {
        return status == StatusSolicitacao.ABERTA;
    }

    public void responder(StatusSolicitacao status, String resposta, String respondidaPor, LocalDateTime respondidaEm) {
        this.status = status;
        this.resposta = resposta;
        this.respondidaPor = respondidaPor;
        this.respondidaEm = respondidaEm;
    }
}
