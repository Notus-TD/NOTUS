package com.pfc.notus.lecionamento.dto;

import com.pfc.notus.lecionamento.domain.Lecionamento;
import com.pfc.notus.user.domain.Professor;
import org.hibernate.Hibernate;

// ! REFL: Resposta da API: vínculo com nome da turma, título da disciplina e nome/e-mail do professor
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
    // ! REFL: converte a entidade; desembrulha o proxy do Hibernate para pegar o nome completo do professor
    public static LecionamentoDTO of(Lecionamento lecionamento) {
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
