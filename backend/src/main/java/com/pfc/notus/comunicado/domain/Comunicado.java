package com.pfc.notus.comunicado.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Comunicado geral da escola (Módulo de Comunicação), publicado pela secretaria. */
@Entity
@Table(name = "tb_comunicado")
@NoArgsConstructor
@Getter
public class Comunicado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(nullable = false, length = 4000)
    private String texto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PublicoComunicado publico;

    @Column(nullable = false)
    private LocalDateTime enviadoEm;

    @Column(nullable = false)
    private String autorEmail;

    @Column(length = 20)
    private String tipoRemetente; // ADMIN ou PROFESSOR

    @Column
    private Long turmaId; // Null para comunicados do admin, preenchido para recados do professor

    public Comunicado(String titulo, String texto, PublicoComunicado publico, String autorEmail, LocalDateTime enviadoEm) {
        this.titulo = titulo;
        this.texto = texto;
        this.publico = publico;
        this.autorEmail = autorEmail;
        this.enviadoEm = enviadoEm;
        this.tipoRemetente = "ADMIN";
        this.turmaId = null;
    }

    public Comunicado(String titulo, String texto, String autorEmail, LocalDateTime enviadoEm, Long turmaId) {
        this.titulo = titulo;
        this.texto = texto;
        this.autorEmail = autorEmail;
        this.enviadoEm = enviadoEm;
        this.tipoRemetente = "PROFESSOR";
        this.turmaId = turmaId;
        this.publico = PublicoComunicado.RESPONSAVEIS; // Professor só manda para responsáveis
    }

    public boolean incluiResponsaveis() {
        return publico == PublicoComunicado.TODOS || publico == PublicoComunicado.RESPONSAVEIS;
    }

    public boolean ehRecadoProfessor() {
        return "PROFESSOR".equals(tipoRemetente);
    }
}
