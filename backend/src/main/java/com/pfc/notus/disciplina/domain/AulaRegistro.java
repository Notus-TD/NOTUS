package com.pfc.notus.disciplina.domain;

import com.pfc.notus.boletim.domain.AnoLetivo;
import com.pfc.notus.turma.domain.Turma;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "tb_aula_registro", uniqueConstraints = @UniqueConstraint(
        name = "uk_aula_turma_disciplina_data", columnNames = {"turma_id", "disciplina_id", "data"}))
// ! REFD: Entidade da tabela tb_aula_registro: quantas aulas de uma disciplina foram dadas numa turma em um dia (único por turma+disciplina+data)
@NoArgsConstructor
public class AulaRegistro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Getter
    private LocalDate data;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disciplina_id", nullable = false)
    @Getter
    private Disciplina disciplina;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turma_id", nullable = false)
    @Getter
    private Turma turma;

    // ! REFD: ano letivo copiado da turma
    @Column(name = "ano_letivo", length = 4)
    @Getter
    private String anoLetivo;

    // ! REFD: quantidade de aulas naquele dia (1, 2...); entra no total para a % de frequência
    @Column(name = "quantidade_aulas", nullable = false)
    @Getter @Setter
    private Integer quantidadeAulas;

    // ! REFD: cria o registro já com o ano letivo da turma
    public AulaRegistro(LocalDate data, Disciplina disciplina, Turma turma, Integer quantidadeAulas) {
        this.data = data;
        this.disciplina = disciplina;
        this.turma = turma;
        this.anoLetivo = AnoLetivo.daTurma(turma);
        this.quantidadeAulas = quantidadeAulas;
    }
}
