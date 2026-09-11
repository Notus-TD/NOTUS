package com.pfc.notus.user.dto.security;

public record StudentInsertDTO(Long Matricula, String fullName, String responsibleName, String responsibleCpf, String responsiblePhoneNumber, String educationalEmail, String responsibleEmail, String address) {
}
