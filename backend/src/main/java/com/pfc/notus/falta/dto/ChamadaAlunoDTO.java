package com.pfc.notus.falta.dto;

import com.pfc.notus.user.domain.Student;

// ! REFF: Uma linha da chamada: aluno, faltas no dia e total de faltas no ano
public record ChamadaAlunoDTO(
        Long studentId,
        String studentName,
        Long matricula,
        int faltasNoDia,
        int totalFaltas
) {
    // ! REFF: monta a linha a partir do aluno e dos totais
    public static ChamadaAlunoDTO of(Student aluno, int faltasNoDia, int totalFaltas) {
        return new ChamadaAlunoDTO(aluno.getId(), aluno.getFullName(), aluno.getMatricula(), faltasNoDia, totalFaltas);
    }
}
