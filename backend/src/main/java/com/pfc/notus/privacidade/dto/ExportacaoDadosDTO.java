package com.pfc.notus.privacidade.dto;

import com.pfc.notus.notificacao.dto.AvisoDTO;

import java.time.LocalDateTime;
import java.util.List;

public record ExportacaoDadosDTO(
        LocalDateTime geradoEm,
        DadosResponsavelDTO responsavel,
        List<DadosAlunoDTO> alunos,
        List<AvisoDTO> avisos,
        List<SolicitacaoDTO> solicitacoes
) {
}
