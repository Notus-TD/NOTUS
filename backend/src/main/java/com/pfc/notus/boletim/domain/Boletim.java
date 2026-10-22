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
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "disciplina_id", "bimestre"}))
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lancado_por_id", nullable = false)
    @Getter @Setter
    private User lancadoPor;

    public Boletim(Student student, Disciplina disciplina, Bimestre bimestre) {
        this.student = student;
        this.disciplina = disciplina;
        this.bimestre = bimestre;
    }
}
