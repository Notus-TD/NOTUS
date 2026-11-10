package com.pfc.notus.privacidade.dto;

import com.pfc.notus.user.domain.enums.StatusMatricula;

public record FilhoResumoDTO(Long id, String nome, Long matricula, StatusMatricula matriculaStatus, boolean anonimizado) {
}
