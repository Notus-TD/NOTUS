package com.pfc.notus.falta.domain;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_falta")
@NoArgsConstructor
public class FaltaDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;
    @Getter @Setter
    private LocalDate data;
    @Getter @Setter
    private Integer quantidade;
    @Getter @Setter
    private LocalDateTime registradoEm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @Getter @Setter
    private Student aluno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disciplina_id", nullable = false)
    @Getter @Setter
    private Disciplina disciplina;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por_id", nullable = false)
    @Getter @Setter
    private User registradoPor;

    public FaltaDomain(Integer quantidade, LocalDate data, LocalDateTime registradoEm, Student aluno, User registradoPor, Disciplina disciplina) {
        this.quantidade = quantidade;
        this.data = data;
        this.registradoEm = LocalDateTime.now();
        this.aluno = aluno;
        this.registradoPor = registradoPor;
        this.disciplina = disciplina;
    }
}