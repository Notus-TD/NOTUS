package com.pfc.notus.entrega.domain;

import com.pfc.notus.atividade.domain.Atividade;
import com.pfc.notus.user.domain.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_entrega")
@NoArgsConstructor
public class Entrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Getter @Setter
    private String content;

    @Getter @Setter
    private LocalDateTime submittedAt;

    @Getter @Setter
    private Float grade;

    @Enumerated(EnumType.STRING)
    @Getter @Setter
    private StatusEntrega status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atividade_id", nullable = false)
    @Getter @Setter
    private Atividade atividade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @Getter @Setter
    private Student student;

    public Entrega(String content, LocalDateTime submittedAt, Float grade, StatusEntrega status) {
        this.content = content;
        this.submittedAt = submittedAt;
        this.grade = grade;
        this.status = status;
    }
}
