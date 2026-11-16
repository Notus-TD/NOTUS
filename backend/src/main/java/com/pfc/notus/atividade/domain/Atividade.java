package com.pfc.notus.atividade.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.turma.domain.Turma;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

// ! REFA: Entidade da tabela tb_atividade: uma tarefa publicada para uma turma em uma disciplina
@Entity
@Table(name = "tb_atividade")
@NoArgsConstructor
public class Atividade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;
    @Getter @Setter
    private String title;
    @Getter @Setter
    private String content;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Getter @Setter
    private Bimestre bimestre;
    @Getter @Setter
    private LocalDate prazo;
    @Getter @Setter
    private LocalDateTime publicadaEm;
    @Getter @Setter
    private Float pontos;

    // ! REFA: ano letivo copiado da turma na publicação, para isolar os dados por ano
    @Column(name = "ano_letivo", length = 4)
    @Getter @Setter
    private String anoLetivo;

    // ! REFA: disciplina e turma da atividade (lazy, não vão pro JSON)
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn( name = "disciplina_id", nullable = false)
    @Getter @Setter
    private Disciplina disciplina;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turma_id", nullable = false)
    @Getter @Setter
    private Turma turma;

    // ! REFA: construtor usado nos testes e seeds
    public Atividade(String title, String content) {
        this.title = title;
        this.content = content;
    }
}
