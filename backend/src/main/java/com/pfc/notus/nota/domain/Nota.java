package com.pfc.notus.nota.domain;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.user.domain.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_nota")
@NoArgsConstructor
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Column(nullable = false)
    @Getter @Setter
    private String descricao;

    @Column(nullable = false)
    @Getter @Setter
    private Float rate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Getter @Setter
    private Bimestre bimestre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @Getter @Setter
    private Student student;

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
