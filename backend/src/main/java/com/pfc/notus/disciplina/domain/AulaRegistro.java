package com.pfc.notus.disciplina.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "tb_aula_registro", uniqueConstraints = @UniqueConstraint(columnNames = {"disciplina_id", "data"}))
@NoArgsConstructor
public class AulaRegistro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Getter
    private LocalDate data;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disciplina_id", nullable = false)
    @Getter
    private Disciplina disciplina;

    public AulaRegistro(LocalDate data, Disciplina disciplina) {
        this.data = data;
        this.disciplina = disciplina;
    }
}
