package com.pfc.notus.user.domain;

import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "tb_student")
@NoArgsConstructor
public class Student extends User {

    @Getter @Setter
    private String fullName;

    @Getter @Setter
    private Long matricula;

    @Getter @Setter
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Getter @Setter
    private StatusMatricula statusMatricula;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    @Getter @Setter
    private Responsible responsible;

    @OneToOne
    private Turma turma;

    public Student(String fullName, String email, Long matricula, LocalDate birthDate, Responsible responsible) {
        super(email);
        this.fullName = fullName;
        this.matricula = matricula;
        this.birthDate = birthDate;
        this.statusMatricula = StatusMatricula.ATIVA;
        this.responsible = responsible;
    }
}
