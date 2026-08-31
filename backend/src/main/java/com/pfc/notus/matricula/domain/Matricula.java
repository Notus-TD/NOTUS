package com.pfc.notus.matricula.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "/tb_matricula")
@NoArgsConstructor
public class Matricula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;
    @Getter @Setter
    private String period;
    @Getter @Setter
    private Float finalAverage;
    @Getter @Setter
    private String status;

    public Matricula(String period, Float finalAverage, String status) {
        this.period = period;
        this.finalAverage = finalAverage;
        this.status = status;
    }
}
