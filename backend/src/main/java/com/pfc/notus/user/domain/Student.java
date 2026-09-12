package com.pfc.notus.user.domain;

import com.pfc.notus.matricula.domain.Matricula;
import com.pfc.notus.turma.domain.Turma;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_student")
@NoArgsConstructor
public class Student {

    @Id
    @Getter
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    @Getter @Setter
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    @Getter @Setter
    private Responsible responsible;

    @Getter @Setter
    private String educationalEmail;

    @Getter @Setter
    private LocalDate birthDate;

    @OneToMany(mappedBy = "student")
    @Getter @Setter
    private List<Matricula> matriculas = new ArrayList<>();

    @OneToOne
    private Turma turma;

    public Student(Long matricula, User user, String educationalEmail, LocalDate birthDate) {
        this.id = matricula;
        this.educationalEmail = educationalEmail;
        this.birthDate = birthDate;
        this.user = user;
    }
}
