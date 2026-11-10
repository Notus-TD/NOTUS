package com.pfc.notus.comunicado.domain;

import com.pfc.notus.boletim.domain.AnoLetivo;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

<<<<<<< HEAD
=======
// ! REFC: Entidade JPA mapeada em tb_comunicado - suporta comunicados globais (admin) e recados de turma (professor)
>>>>>>> eb86b0c86e7803a1df276d182ae1cf843dd8d402
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

    // ! REFC: Escopo local: null=comunicado global (admin), preenchido=recado de turma específica (professor)
    @Column
    private Long turmaId;

<<<<<<< HEAD
=======
    // ! REFC: Rastreia em qual ano letivo o comunicado foi publicado
>>>>>>> eb86b0c86e7803a1df276d182ae1cf843dd8d402
    @Column(name = "ano_letivo", length = 4)
    private String anoLetivo;

    // ! REFC: Construtor para comunicados globais (admin): público escolhido pelo admin, turmaId sempre null
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

    // ! REFC: Construtor para recados de turma (professor): público fixo=RESPONSAVEIS, turmaId preenchido
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

    // ! REFC: Decide se dispara evento de e-mail: true apenas para TODOS e RESPONSAVEIS
    public boolean incluiResponsaveis() {
        return publico == PublicoComunicado.TODOS || publico == PublicoComunicado.RESPONSAVEIS;
    }

    // ! REFC: Diferencia comunicado do admin (false) de recado do professor (true)
    public boolean ehRecadoProfessor() {
        return "PROFESSOR".equals(tipoRemetente);
    }
}
