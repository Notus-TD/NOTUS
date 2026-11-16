package com.pfc.notus.boletim.dto;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.disciplina.domain.Disciplina;

import java.time.LocalDateTime;

/**
 * Uma disciplina num bimestre do boletim. {@code nota} é a nota que vale:
 * - com nota final lançada: exatamente a nota final, que o professor envia já fechada (não soma atividades);
 * - sem nota final: a média das avaliações somada aos pontos das atividades, limitada a 10 (nota parcial).
 */
// ! REFB: Um bimestre de uma disciplina no boletim; 'nota' é a nota final se lançada, senão média + pontos de atividades (máx 10)
public record BoletimDTO(
        Long id,
        Long studentId,
        Long disciplinaId,
        String disciplinaTitle,
        Bimestre bimestre,
        Float mediaCalculada,
        Float notaFinal,
        Float nota,
        LocalDateTime lancadoEm,
        Float pontosAtividades
) {
    private static final float NOTA_MAXIMA = 10f;

    // ! REFB: monta a linha quando o professor já lançou a nota final
    public static BoletimDTO comNotaFinal(Boletim b, Float mediaCalculada, Float pontosAtividades) {
        return new BoletimDTO(b.getId(), b.getStudent().getId(), b.getDisciplina().getId(), b.getDisciplina().getTitle(),
                b.getBimestre(), mediaCalculada, b.getNotaFinal(), b.getNotaFinal(),
                b.getLancadoEm(), pontosAtividades);
    }

    // ! REFB: monta a linha parcial, calculando a nota com média + atividades
    public static BoletimDTO semNotaFinal(Long studentId, Disciplina disciplina, Bimestre bimestre,
                                          Float mediaCalculada, Float pontosAtividades) {
        return new BoletimDTO(null, studentId, disciplina.getId(), disciplina.getTitle(), bimestre, mediaCalculada,
                null, somarAtividades(mediaCalculada, pontosAtividades), null, pontosAtividades);
    }

    // ! REFB: soma pontos de atividades na média sem passar de 10
    private static Float somarAtividades(Float nota, Float pontosAtividades) {
        if (nota == null) {
            return null;
        }
        return Math.min(nota + (pontosAtividades == null ? 0f : pontosAtividades), NOTA_MAXIMA);
    }
}
