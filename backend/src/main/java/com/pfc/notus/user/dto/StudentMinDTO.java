package com.pfc.notus.user.dto;

import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;

import java.time.LocalDateTime;

// ! REFU: Aluno resumido para listagens: matrícula, nome, status, turma, se foi anonimizado e se tem acesso
public record StudentMinDTO(Long userId, Long matricula, String studentName, StatusMatricula matriculaStatus,
                            Long turmaId, String turmaName, boolean anonimizado,
                            LocalDateTime acessoLiberadoEm) {

    // ! REFU: converte a entidade tratando turma nula
    public static StudentMinDTO of(Student s) {
        Turma turma = s.getTurma();
        return new StudentMinDTO(s.getId(), s.getMatricula(), s.getFullName(), s.getStatusMatricula(),
                turma == null ? null : turma.getId(), turma == null ? null : turma.getName(),
                s.getAnonimizadoEm() != null, s.getAcessoLiberadoEm());
    }
}
