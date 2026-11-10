package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.Responsible;

public record ResponsibleDTO(Long id, String name, String email, String phone) {

    public static ResponsibleDTO of(Responsible r) {
        return new ResponsibleDTO(r.getId(), r.getName(), r.getEmail(), r.getPhone());
    }
}
