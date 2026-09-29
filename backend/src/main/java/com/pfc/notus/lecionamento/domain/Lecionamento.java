package com.pfc.notus.lecionamento.domain;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tb_lecionamento",
        uniqueConstraints = @UniqueConstraint(columnNames = {"turma_id", "disciplina_id", "professor_id"}))
@NoArgsConstructor
public class Lecionamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turma_id", nullable = false)
    @Getter
    private Turma turma;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disciplina_id", nullable = false)
    @Getter
    private Disciplina disciplina;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "professor_id", nullable = false)
    @Getter
    private User professor;

    public Lecionamento(Turma turma, Disciplina disciplina, User professor) {
        this.turma = turma;
        this.disciplina = disciplina;
        this.professor = professor;
    }
}
