package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.enums.StatusMatricula;

// ! REFU: Linha da lista de usuários do admin: perfil (ALUNO/RESPONSAVEL), nome, matrícula, anonimizado, acesso pendente e status
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
