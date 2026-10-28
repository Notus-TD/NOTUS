package com.pfc.notus.lecionamento.dto;

import com.pfc.notus.lecionamento.domain.Lecionamento;
import com.pfc.notus.user.domain.Professor;
import org.hibernate.Hibernate;

public record LecionamentoDTO(
        Long id,
        Long turmaId,
        String turmaName,
        Long disciplinaId,
        String disciplinaTitle,
        Long professorId,
        String professorName,
        String professorEmail
) {
    public static LecionamentoDTO of(Lecionamento lecionamento) {
        // O professor vem como proxy lazy de User; sem unproxy o instanceof Professor falha.
        Object professor = Hibernate.unproxy(lecionamento.getProfessor());
        String nome = professor instanceof Professor p ? p.getFullName() : null;
        return new LecionamentoDTO(
                lecionamento.getId(),
                lecionamento.getTurma().getId(),
                lecionamento.getTurma().getName(),
                lecionamento.getDisciplina().getId(),
                lecionamento.getDisciplina().getTitle(),
                lecionamento.getProfessor().getId(),
                nome,
                lecionamento.getProfessor().getEmail()
        );
    }
}
