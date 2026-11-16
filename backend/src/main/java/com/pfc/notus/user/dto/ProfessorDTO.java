package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.Professor;

public record ProfessorDTO(Long id, String fullName, String email, boolean acessoPendente, boolean desligado) {
    public static ProfessorDTO of(Professor p) {
        return new ProfessorDTO(p.getId(), p.getFullName(), p.getEmail(), p.isFirstLogin(), !p.isAtivo());
    }
}
