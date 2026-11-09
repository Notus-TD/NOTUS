package com.pfc.notus.boletim.domain;

import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.Student;

import java.time.Year;

/**
 * Ano letivo em que as notas, faltas, aulas, atividades e comunicados são lançados e consultados.
 * Assim, quando o aluno passa de ano (ex.: do 6º para o 7º), o boletim novo começa vazio e os
 * registros do ano anterior continuam guardados, sem serem sobrescritos.
 */
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

    /** Usado para registros sem turma/aluno associado diretamente (ex.: comunicados da coordenação). */
    public static String atual() {
        return String.valueOf(Year.now().getValue());
    }
}
