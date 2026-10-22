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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atividade_id", nullable = false)
    @Getter @Setter
    private Atividade atividade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @Getter @Setter
    private Student student;

    public Entrega(Atividade atividade, Student student) {
        this.atividade = atividade;
        this.student = student;
    }
}
