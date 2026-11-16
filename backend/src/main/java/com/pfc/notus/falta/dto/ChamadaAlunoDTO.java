package com.pfc.notus.falta.dto;

import com.pfc.notus.user.domain.Student;

public record ChamadaAlunoDTO(
        Long studentId,
        String studentName,
        Long matricula,
        int faltasNoDia,
        int totalFaltas
) {
    public static ChamadaAlunoDTO of(Student aluno, int faltasNoDia, int totalFaltas) {
        return new ChamadaAlunoDTO(aluno.getId(), aluno.getFullName(), aluno.getMatricula(), faltasNoDia, totalFaltas);
    }
}
