package com.pfc.notus.matricula.domain;

import com.pfc.notus.user.domain.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "tb_matricula")
@NoArgsConstructor
public class Matricula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    @Getter @Setter
    private Student student;

    @Getter @Setter
    private String period;

    @Enumerated(EnumType.STRING)
    @Getter @Setter
    private StatusMatricula status;

    @Getter
    private LocalDate createdAt;

    public Matricula(Student student, String period, StatusMatricula status) {
        this.student = student;
        this.period = period;
        this.status = status;
        this.createdAt = LocalDate.now();
    }
}
