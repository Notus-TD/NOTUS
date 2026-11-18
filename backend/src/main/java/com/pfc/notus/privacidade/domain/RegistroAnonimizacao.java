package com.pfc.notus.privacidade.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// ! REFP: Entidade da tabela tb_registro_anonimizacao: quem foi anonimizado, por qual motivo, por quem e quando
@Entity
@Table(name = "tb_registro_anonimizacao")
@NoArgsConstructor
@Getter
public class RegistroAnonimizacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long usuarioId;

    @Column(nullable = false, length = 20)
    private String perfil;

    // ! REFP: matrícula guardada para o histórico (aluno), já que o nome é apagado
    private Long matricula;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MotivoAnonimizacao motivo;

    @Column(length = 500)
    private String detalhe;

    @Column(nullable = false)
    private String executadoPor;

    @Column(nullable = false)
    private LocalDateTime executadoEm;

    // ! REFP: construtor com todos os campos
    public RegistroAnonimizacao(Long usuarioId, String perfil, Long matricula, MotivoAnonimizacao motivo, String detalhe,
                                String executadoPor, LocalDateTime executadoEm) {
        this.usuarioId = usuarioId;
        this.perfil = perfil;
        this.matricula = matricula;
        this.motivo = motivo;
        this.detalhe = detalhe;
        this.executadoPor = executadoPor;
        this.executadoEm = executadoEm;
    }
}
