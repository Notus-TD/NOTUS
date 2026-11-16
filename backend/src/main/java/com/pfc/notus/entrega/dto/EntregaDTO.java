package com.pfc.notus.entrega.dto;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.entrega.domain.Entrega;
import com.pfc.notus.entrega.domain.StatusEntrega;

// ! REFE: Resposta da API: entrega com dados da atividade (título, disciplina, bimestre, valor) e pontos obtidos
public record EntregaDTO(
        Long id,
        StatusEntrega status,
        Long atividadeId,
        String atividadeTitle,
        Long disciplinaId,
        Bimestre bimestre,
        Long studentId,
        Float pontos,
        Float pontosObtidos
) {
    // ! REFE: converte a entidade puxando os dados da atividade
    public static EntregaDTO from(Entrega e) {
        return new EntregaDTO(e.getId(), e.getStatus(), e.getAtividade().getId(), e.getAtividade().getTitle(),
                e.getAtividade().getDisciplina().getId(), e.getAtividade().getBimestre(), e.getStudent().getId(),
                e.getAtividade().getPontos(), e.getPontosObtidos());
    }
}
