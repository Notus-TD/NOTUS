package com.pfc.notus.turma.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pfc.notus.lecionamento.domain.Lecionamento;
import com.pfc.notus.user.domain.Student;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_turma",
        uniqueConstraints = @UniqueConstraint(columnNames = {"name", "school_year"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Turma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @Column(name = "name", nullable = false)
    private String name;

    @Setter
    @Column(name = "school_year", nullable = false)
    private String schoolYear;

    @OneToMany(mappedBy = "turma")
    @JsonIgnore
    private List<Lecionamento> lecionamentos = new ArrayList<>();

    @OneToMany(mappedBy = "turma")
    @JsonIgnore
    private List<Student> alunos = new ArrayList<>();

    public Turma(String name, String schoolYear) {
        this.name = name;
        this.schoolYear = schoolYear;
    }
}
