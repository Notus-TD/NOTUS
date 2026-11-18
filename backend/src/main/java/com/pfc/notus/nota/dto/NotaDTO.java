package com.pfc.notus.nota.dto;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.nota.domain.Nota;

// ! REFNO: Resposta da API: nota com aluno, disciplina (id e título) e bimestre
public record NotaDTO(
        Long id,
        String descricao,
        Float rate,
        Bimestre bimestre,
        Long studentId,
        Long disciplinaId,
        String disciplinaTitle
) {
    // ! REFNO: converte a entidade para DTO
    public static NotaDTO from(Nota n) {
        return new NotaDTO(n.getId(), n.getDescricao(), n.getRate(), n.getBimestre(), n.getStudent().getId(),
                n.getDisciplina().getId(), n.getDisciplina().getTitle());
    }
}
