package com.pfc.notus.boletim.domain;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_boletim",
        uniqueConstraints = @UniqueConstraint(name = "uk_boletim_aluno_disciplina_bimestre_ano",
                columnNames = {"student_id", "disciplina_id", "bimestre", "ano_letivo"}))
// ! REFB: Entidade da tabela tb_boletim: a nota final de um aluno em uma disciplina em um bimestre (única por ano letivo)
@NoArgsConstructor
public class Boletim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Getter @Setter
    private Bimestre bimestre;

    // ! REFB: ano letivo da turma do aluno no momento do lançamento
    @Column(name = "ano_letivo", length = 9)
    @Getter @Setter
    private String anoLetivo;

    @Column(nullable = false)
    @Getter @Setter
    private Float notaFinal;

    @Column(nullable = false)
    @Getter @Setter
    private LocalDateTime lancadoEm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @Getter @Setter
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disciplina_id", nullable = false)
    @Getter @Setter
    private Disciplina disciplina;

    // ! REFB: quem lançou a nota (professor ou admin)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lancado_por_id", nullable = false)
    @Getter @Setter
    private User lancadoPor;

    // ! REFB: cria o registro já com o ano letivo do aluno
    public Boletim(Student student, Disciplina disciplina, Bimestre bimestre) {
        this.student = student;
        this.disciplina = disciplina;
        this.bimestre = bimestre;
        this.anoLetivo = AnoLetivo.doAluno(student);
    }
}
