package com.pfc.notus.user.dto;

/** acessoPendente: ainda não abriu o link de convite para definir a senha. */
public record ProfessorDTO(Long id, String fullName, String email, boolean acessoPendente) {
}
