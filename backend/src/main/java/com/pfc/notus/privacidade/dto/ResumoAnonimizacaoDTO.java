package com.pfc.notus.privacidade.dto;

import com.pfc.notus.user.domain.enums.StatusMatricula;

import java.time.LocalDateTime;
import java.util.List;

// ! REFP: Resumo antes de anonimizar: dados do titular, filhos (se responsável), quantos registros ficam e o motivo de bloqueio
public record ResumoAnonimizacaoDTO(
        Long id,
        String perfil,
        String nome,
        String email,
        Long matricula,
        StatusMatricula matriculaStatus,
        String turmaName,
        String responsavelNome,
        boolean acessoLiberado,
        String motivoCancelamento,
        LocalDateTime matriculaCanceladaEm,
        List<FilhoResumoDTO> filhos,
        long notasDeBimestre,
        long faltas,
        long entregas,
        long avisos,
        LocalDateTime anonimizadoEm,
        RegistroAnonimizacaoDTO registro,
        String bloqueio
) {
}
