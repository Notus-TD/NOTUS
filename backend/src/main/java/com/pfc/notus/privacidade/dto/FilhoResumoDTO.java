package com.pfc.notus.privacidade.dto;

import com.pfc.notus.user.domain.enums.StatusMatricula;

// ! REFP: Um filho no resumo do responsável: nome, matrícula, status e se já foi anonimizado
public record FilhoResumoDTO(Long id, String nome, Long matricula, StatusMatricula matriculaStatus, boolean anonimizado) {
}
