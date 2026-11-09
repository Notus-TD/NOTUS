package com.pfc.notus.user.dto;

import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;

import java.time.LocalDate;

public record StudentDetalheDTO(
        Long userId,
        String fullName,
        String educationalEmail,
        Long matricula,
        LocalDate birthDate,
        StatusMatricula matriculaStatus,
        Long turmaId,
        String turmaName,
        Long responsibleId,
        String responsibleName,
        String responsibleEmail,
        String responsiblePhone
) {
    public static StudentDetalheDTO of(Student s) {
        Responsible r = s.getResponsible();
        return new StudentDetalheDTO(
                s.getId(), s.getFullName(), s.getEmail(), s.getMatricula(), s.getBirthDate(), s.getStatusMatricula(),
                s.getTurma() == null ? null : s.getTurma().getId(),
                s.getTurma() == null ? null : s.getTurma().getName(),
                r == null ? null : r.getId(),
                r == null ? null : r.getName(),
                r == null ? null : r.getEmail(),
                r == null ? null : r.getPhone()
        );
    }
}
