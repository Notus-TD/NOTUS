package com.pfc.notus.user.dto;

public record UsuarioDTO(
        Long id,
        String perfil,
        String nome,
        Long matricula,
        boolean anonimizado
) {
}
