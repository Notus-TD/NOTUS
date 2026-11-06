package com.pfc.notus.user.dto;

import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.Student;

import com.pfc.notus.user.domain.enums.StatusMatricula;

/**
 * turmaId/turmaName: a turma atual do aluno, vazios se ele ainda não tem turma.
 * anonimizado: os dados pessoais foram apagados (o nome vem vazio e a matrícula, finalizada).
 */
public record StudentMinDTO(Long userId, Long matricula, String studentName, StatusMatricula matriculaStatus,
                            Long turmaId, String turmaName, boolean anonimizado) {

    public static StudentMinDTO of(Student s) {
        Turma turma = s.getTurma();
        return new StudentMinDTO(s.getId(), s.getMatricula(), s.getFullName(), s.getStatusMatricula(),
                turma == null ? null : turma.getId(), turma == null ? null : turma.getName(),
                s.getAnonimizadoEm() != null);
    }
}
