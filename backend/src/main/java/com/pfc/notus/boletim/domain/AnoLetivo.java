package com.pfc.notus.boletim.domain;

import com.pfc.notus.user.domain.Student;

import java.time.Year;

/**
 * Ano letivo em que as notas de um aluno são lançadas e consultadas: o da turma atual dele.
 * Assim, quando o aluno passa de ano (ex.: do 6º para o 7º), o boletim novo começa vazio e as
 * notas do ano anterior continuam guardadas, sem serem sobrescritas.
 */
public final class AnoLetivo {

    private AnoLetivo() {
    }

    public static String doAluno(Student aluno) {
        if (aluno.getTurma() != null && aluno.getTurma().getSchoolYear() != null) {
            return aluno.getTurma().getSchoolYear().trim();
        }
        return String.valueOf(Year.now().getValue());
    }
}
