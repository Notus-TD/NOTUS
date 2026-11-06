package com.pfc.notus.disciplina.domain;

import com.pfc.notus.turma.domain.Turma;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

/**
 * Uma aula dada de uma disciplina em uma turma, numa data (RF05 RN02: no máximo uma por turma e disciplina
 * em cada data). A frequência do aluno conta só as aulas da turma dele.
 */
@Entity
@Table(name = "tb_aula_registro", uniqueConstraints = @UniqueConstraint(
        name = "uk_aula_turma_disciplina_data", columnNames = {"turma_id", "disciplina_id", "data"}))
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turma_id", nullable = false)
    @Getter
    private Turma turma;

    public AulaRegistro(LocalDate data, Disciplina disciplina, Turma turma) {
        this.data = data;
        this.disciplina = disciplina;
        this.turma = turma;
    }
}
