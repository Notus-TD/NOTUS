package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.Professor;

// ! REFU: Professor na API: nome, e-mail, se ainda não ativou o acesso e se foi desligado
public record ProfessorDTO(Long id, String fullName, String email, boolean acessoPendente, boolean desligado) {
    // ! REFU: converte a entidade
    public static ProfessorDTO of(Professor p) {
        return new ProfessorDTO(p.getId(), p.getFullName(), p.getEmail(), p.isFirstLogin(), !p.isAtivo());
    }
}
