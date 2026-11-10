package com.pfc.notus.comunicado.domain;

import com.pfc.notus.boletim.domain.AnoLetivo;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    private String tipoRemetente;

    @Column
    private Long turmaId;

    @Column(name = "ano_letivo", length = 4)
    private String anoLetivo;

    public Comunicado(String titulo, String texto, PublicoComunicado publico, String autorEmail, LocalDateTime enviadoEm) {
        this.titulo = titulo;
        this.texto = texto;
        this.publico = publico;
        this.autorEmail = autorEmail;
        this.enviadoEm = enviadoEm;
        this.tipoRemetente = "ADMIN";
        this.turmaId = null;
        this.anoLetivo = AnoLetivo.atual();
    }

    public Comunicado(String titulo, String texto, String autorEmail, LocalDateTime enviadoEm, Long turmaId) {
        this.titulo = titulo;
        this.texto = texto;
        this.autorEmail = autorEmail;
        this.enviadoEm = enviadoEm;
        this.tipoRemetente = "PROFESSOR";
        this.turmaId = turmaId;
        this.publico = PublicoComunicado.RESPONSAVEIS;
        this.anoLetivo = AnoLetivo.atual();
    }

    public boolean incluiResponsaveis() {
        return publico == PublicoComunicado.TODOS || publico == PublicoComunicado.RESPONSAVEIS;
    }

    public boolean ehRecadoProfessor() {
        return "PROFESSOR".equals(tipoRemetente);
    }
}
