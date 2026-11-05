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

    public Comunicado(String titulo, String texto, PublicoComunicado publico, String autorEmail, LocalDateTime enviadoEm) {
        this.titulo = titulo;
        this.texto = texto;
        this.publico = publico;
        this.autorEmail = autorEmail;
        this.enviadoEm = enviadoEm;
    }

    public boolean incluiResponsaveis() {
        return publico == PublicoComunicado.TODOS || publico == PublicoComunicado.RESPONSAVEIS;
    }
}
