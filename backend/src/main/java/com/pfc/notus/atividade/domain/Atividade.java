package com.pfc.notus.atividade.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.turma.domain.Turma;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
    @Getter @Setter
    private String status;
    @Getter @Setter
    private LocalDate prazo;
    @Getter @Setter
    private LocalDateTime publicadaEm;

    // as respostas da API usam AtividadeDTO; sem @JsonIgnore a disciplina serializaria
    // a lista de atividades, que serializaria a disciplina de novo, sem fim
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

    public Atividade(String title, String content) {
        this.title = title;
        this.content = content;
        this.status = "Status";
    }
}
