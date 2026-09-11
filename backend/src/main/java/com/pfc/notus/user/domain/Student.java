package com.pfc.notus.user.domain;

import com.pfc.notus.matricula.domain.Matricula;
import com.pfc.notus.turma.domain.Turma;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    private String educationalEmail;

    @OneToMany(mappedBy = "student")
    @Getter @Setter
    private List<Matricula> matriculas = new ArrayList<>();

    @OneToOne
    private Turma turma;

    public Student(Long matricula, User user, Responsible responsible) {
        this.id = matricula;
        this.user = user;
        this.responsible = responsible;
    }
}
