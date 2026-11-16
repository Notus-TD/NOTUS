package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.Responsible;

// ! REFU: Responsável na API: id, nome, e-mail e telefone
public record ResponsibleDTO(Long id, String name, String email, String phone) {

    // ! REFU: converte a entidade
    public static ResponsibleDTO of(Responsible r) {
        return new ResponsibleDTO(r.getId(), r.getName(), r.getEmail(), r.getPhone());
    }
}
