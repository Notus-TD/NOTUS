package com.pfc.notus.user.dto;

// ! REFU: Resposta do cadastro: id gerado e nome do aluno
public record StudentRegistrationResponse(Long userId, String studentName) {
}
