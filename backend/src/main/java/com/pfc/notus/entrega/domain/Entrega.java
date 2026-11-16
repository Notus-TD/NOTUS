package com.pfc.notus.entrega.domain;

import com.pfc.notus.atividade.domain.Atividade;
import com.pfc.notus.user.domain.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_entrega",
        uniqueConstraints = @UniqueConstraint(columnNames = {"atividade_id", "student_id"}))
// ! REFE: Entidade da tabela tb_entrega: status e pontos de um aluno em uma atividade (única por atividade+aluno)
@NoArgsConstructor
public class Entrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Getter @Setter
    private StatusEntrega status;

    // ! REFE: pontos que o aluno tirou; entra na nota do bimestre no boletim
    @Getter @Setter
    private Float pontosObtidos;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atividade_id", nullable = false)
    @Getter @Setter
    private Atividade atividade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @Getter @Setter
    private Student student;

    // ! REFE: cria a entrega ainda sem status (o service preenche)
    public Entrega(Atividade atividade, Student student) {
        this.atividade = atividade;
        this.student = student;
    }
}
