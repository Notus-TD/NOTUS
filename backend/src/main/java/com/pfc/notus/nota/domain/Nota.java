package com.pfc.notus.nota.domain;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.user.domain.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// REFN: entidade de nota (avaliação individual)
@Entity
@Table(name = "tb_nota")
@NoArgsConstructor
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    // REFN: descrição da avaliação (ex: "Prova de Matemática")
    @Column(nullable = false)
    @Getter @Setter
    private String descricao;

    // REFN: valor da nota (0.0 - 10.0)
    @Column(nullable = false)
    @Getter @Setter
    private Float rate;

    // REFN: bimestre da nota
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Getter @Setter
    private Bimestre bimestre;

    // REFN: ano letivo da nota
    @Column(name = "ano_letivo", length = 9)
    @Getter @Setter
    private String anoLetivo;

    // REFN: aluno que recebeu a nota
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @Getter @Setter
    private Student student;

    // REFN: disciplina da nota
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disciplina_id", nullable = false)
    @Getter @Setter
    private Disciplina disciplina;

    public Nota(String descricao, Float rate, Bimestre bimestre) {
        this.descricao = descricao;
        this.rate = rate;
        this.bimestre = bimestre;
    }
}
