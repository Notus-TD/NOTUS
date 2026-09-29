package com.pfc.notus.disciplina.domain;


import com.pfc.notus.atividade.domain.Atividade;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    @OneToMany(mappedBy = "disciplina", cascade = CascadeType.ALL, orphanRemoval = true)
    @Getter @Setter
    private List<Atividade> atividades = new ArrayList<>();

    public Disciplina(String title, String description) {
        this.title = title;
        this.description = description;
        this.created = LocalDateTime.now();
    }
}
