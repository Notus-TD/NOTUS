package com.pfc.notus.privacidade.dto;

import com.pfc.notus.notificacao.dto.AvisoDTO;

import java.time.LocalDateTime;
import java.util.List;

// ! REFP: Resposta da exportação LGPD: quando foi gerada, dados do responsável, dos alunos e os avisos recebidos
public record ExportacaoDadosDTO(
        LocalDateTime geradoEm,
        DadosResponsavelDTO responsavel,
        List<DadosAlunoDTO> alunos,
        List<AvisoDTO> avisos
) {
}
