package com.pfc.notus.turma.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pfc.notus.lecionamento.domain.Lecionamento;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_turma")
@NoArgsConstructor
public class Turma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;
    @Getter @Setter
    private String name;
    @Getter @Setter
    private String schoolYear;

    @OneToMany(mappedBy = "turma")
    @JsonIgnore
    @Getter
    private List<Lecionamento> lecionamentos = new ArrayList<>();

    public Turma(String name,String schoolYear){
        this.name = name;
        this.schoolYear = schoolYear;
    }
}
