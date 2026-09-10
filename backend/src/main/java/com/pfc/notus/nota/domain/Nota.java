package com.pfc.notus.nota.domain;

import com.pfc.notus.boletim.domain.Boletim;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_nota")
@NoArgsConstructor
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;
    @Getter @Setter
    private String period;
    @Getter @Setter
    private Float rate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "boletim_id", nullable = false)
    @Getter @Setter
    private Boletim boletim;


    public Nota(Float rate, String period) {
        this.rate = rate;
        this.period = period;
    }
}
