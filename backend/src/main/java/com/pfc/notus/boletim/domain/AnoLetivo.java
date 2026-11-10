package com.pfc.notus.boletim.domain;

import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.Student;

import java.time.Year;

public final class AnoLetivo {

    private AnoLetivo() {
    }

    public static String doAluno(Student aluno) {
        if (aluno.getTurma() != null && aluno.getTurma().getSchoolYear() != null) {
            return aluno.getTurma().getSchoolYear().trim();
        }
        return atual();
    }

    public static String daTurma(Turma turma) {
        if (turma != null && turma.getSchoolYear() != null) {
            return turma.getSchoolYear().trim();
        }
        return atual();
    }

    public static String atual() {
        return String.valueOf(Year.now().getValue());
    }
}
