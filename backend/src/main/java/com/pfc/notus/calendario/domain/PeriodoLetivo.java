package com.pfc.notus.calendario.domain;

import com.pfc.notus.boletim.domain.Bimestre;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Um bimestre do calendário letivo. Ele fica aberto para lançamentos até a data de fim e fecha sozinho no dia
 * seguinte. Para corrigir algo depois disso, a secretaria muda a data de fim.
 */
@Entity
@Table(name = "tb_periodo_letivo",
        uniqueConstraints = @UniqueConstraint(name = "uk_periodo_ano_bimestre", columnNames = {"ano_letivo", "bimestre"}))
@NoArgsConstructor
@Getter
public class PeriodoLetivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ano_letivo", nullable = false, length = 4)
    private String anoLetivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Bimestre bimestre;

    @Setter
    @Column(nullable = false)
    private LocalDate inicio;

    @Setter
    @Column(nullable = false)
    private LocalDate fim;

    public PeriodoLetivo(String anoLetivo, Bimestre bimestre, LocalDate inicio, LocalDate fim) {
        this.anoLetivo = anoLetivo;
        this.bimestre = bimestre;
        this.inicio = inicio;
        this.fim = fim;
    }

    public boolean contem(LocalDate data) {
        return !data.isBefore(inicio) && !data.isAfter(fim);
    }

    /** Aberto para lançamentos até o último dia do bimestre (inclusive). */
    public boolean aberto(LocalDate hoje) {
        return !hoje.isAfter(fim);
    }
}
