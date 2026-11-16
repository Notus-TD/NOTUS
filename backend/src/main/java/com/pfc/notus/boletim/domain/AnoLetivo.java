package com.pfc.notus.boletim.domain;

import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.Student;

import java.time.Year;

// ! REFB: Utilitário para descobrir o ano letivo de um aluno ou turma (cai no ano atual se não tiver)
public final class AnoLetivo {

    private AnoLetivo() {
    }

    // ! REFB: ano letivo da turma do aluno
    public static String doAluno(Student aluno) {
        if (aluno.getTurma() != null && aluno.getTurma().getSchoolYear() != null) {
            return aluno.getTurma().getSchoolYear().trim();
        }
        return atual();
    }

    // ! REFB: ano letivo (schoolYear) da turma
    public static String daTurma(Turma turma) {
        if (turma != null && turma.getSchoolYear() != null) {
            return turma.getSchoolYear().trim();
        }
        return atual();
    }

    // ! REFB: ano corrente como texto
    public static String atual() {
        return String.valueOf(Year.now().getValue());
    }
}
