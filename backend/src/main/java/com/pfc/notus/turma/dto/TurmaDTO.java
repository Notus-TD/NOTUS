package com.pfc.notus.turma.dto;

// ! REFT: Turma na listagem: id, nome, ano letivo e quantos alunos tem
public record TurmaDTO(Long id, String name, String schoolYear, int totalAlunos) {
}
