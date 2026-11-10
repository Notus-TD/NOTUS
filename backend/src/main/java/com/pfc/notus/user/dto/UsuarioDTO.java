package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.enums.StatusMatricula;

public record UsuarioDTO(
        Long id,
        String perfil,
        String nome,
        Long matricula,
        boolean anonimizado,
        boolean acessoPendente,
        StatusMatricula matriculaStatus
) {
}
