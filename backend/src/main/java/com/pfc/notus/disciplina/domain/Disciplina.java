package com.pfc.notus.disciplina.domain;


import com.pfc.notus.atividade.domain.Atividade;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// ! REFD: Entidade da tabela tb_disciplina: matéria (ex: Matemática) com título, descrição e data de criação
@Entity
@Table(name ="tb_disciplina")
@NoArgsConstructor
public class Disciplina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;
    @Getter @Setter
    private String title;
    @Getter @Setter
    private String description;
    @Getter @Setter
    private LocalDateTime created;

    // ! REFD: atividades publicadas nessa disciplina; apagar a disciplina apaga as atividades
    @OneToMany(mappedBy = "disciplina", cascade = CascadeType.ALL, orphanRemoval = true)
    @Getter @Setter
    private List<Atividade> atividades = new ArrayList<>();

    // ! REFD: construtor usado nos testes e seeds
    public Disciplina(String title, String description) {
        this.title = title;
        this.description = description;
        this.created = LocalDateTime.now();
    }
}
