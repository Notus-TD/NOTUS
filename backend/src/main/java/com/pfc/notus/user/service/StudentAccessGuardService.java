package com.pfc.notus.user.service;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.lecionamento.domain.Lecionamento;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// ! REFU: Central de permissões: quem pode ver um aluno, uma turma ou lançar dados em uma disciplina
@Service
@RequiredArgsConstructor
public class StudentAccessGuardService {

    // ! REFU: repositórios de usuário, aluno e vínculo professor-turma
    private final UserRepository userRepository;

    private final StudentRepository studentRepository;

    private final LecionamentoRepository lecionamentoRepository;

    // ! REFU: ver aluno: admin sempre; professor se dá aula na turma dele; aluno se for ele mesmo; responsável se for filho
    @Transactional(readOnly = true)
    public void assertCanView(Long studentId, String requesterEmail) {
        User requester = findRequester(requesterEmail);

        if (requester.hasRole("ROLE_ADMIN")) return;
        boolean pode = requester.hasRole("ROLE_PROFESSOR")
                ? professorDaTurmaDoAluno(requester, studentId)
                : alunoOuSeuResponsavel(requester, studentId);
        if (!pode) {
            throw new AccessDeniedException("Sem permissão para ver os dados deste aluno.");
        }
    }

    // ! REFU: o professor leciona na turma atual do aluno?
    private boolean professorDaTurmaDoAluno(User professor, Long studentId) {
        Long turmaId = turmaIdDoAluno(studentId);
        return turmaId != null && lecionamentoRepository.existsByProfessorIdAndTurmaId(professor.getId(), turmaId);
    }

    /** O próprio aluno ou o responsável dele. */
    // ! REFU: é o próprio aluno ou o responsável dele?
    private static boolean alunoOuSeuResponsavel(User requester, Long studentId) {
        if (requester.getId().equals(studentId)) return true;
        return requester instanceof Responsible responsavel
                && responsavel.getStudents().stream().anyMatch(s -> s.getId().equals(studentId));
    }

    // ! REFU: ver filhos de um responsável: admin ou o próprio responsável
    @Transactional(readOnly = true)
    public void assertCanViewResponsible(Long responsibleId, String requesterEmail) {
        User requester = findRequester(requesterEmail);

        if (requester.hasRole("ROLE_ADMIN")) return;
        if (requester.getId().equals(responsibleId)) return;
        throw new AccessDeniedException("Sem permissão para ver os alunos deste responsável.");
    }

    // ! REFU: ver turma: admin ou professor que leciona nela
    @Transactional(readOnly = true)
    public void assertCanViewTurma(Long turmaId, String requesterEmail) {
        User requester = findRequester(requesterEmail);

        if (requester.hasRole("ROLE_ADMIN")) return;
        if (requester.hasRole("ROLE_PROFESSOR")
                && lecionamentoRepository.existsByProfessorIdAndTurmaId(requester.getId(), turmaId)) {
            return;
        }
        throw new AccessDeniedException("Sem permissão para ver esta turma.");
    }

    // ! REFU: lançar nota/falta/entrega para um aluno: admin ou professor que dá aquela disciplina na turma do aluno
    @Transactional(readOnly = true)
    public void assertCanTeach(Long studentId, Long disciplinaId, String requesterEmail) {
        User requester = findRequester(requesterEmail);

        if (requester.hasRole("ROLE_ADMIN")) return;
        if (requester.hasRole("ROLE_PROFESSOR")) {
            Long turmaId = turmaIdDoAluno(studentId);
            if (turmaId != null && lecionamentoRepository
                    .existsByProfessorIdAndTurmaIdAndDisciplinaId(requester.getId(), turmaId, disciplinaId)) {
                return;
            }
        }
        throw new AccessDeniedException("Sem permissão para lançar dados desta disciplina para este aluno.");
    }

    // ! REFU: mesma regra do assertCanTeach, mas partindo da turma em vez do aluno
    @Transactional(readOnly = true)
    public void assertCanTeachTurma(Long turmaId, Long disciplinaId, String requesterEmail) {
        User requester = findRequester(requesterEmail);

        if (requester.hasRole("ROLE_ADMIN")) return;
        if (requester.hasRole("ROLE_PROFESSOR")
                && lecionamentoRepository.existsByProfessorIdAndTurmaIdAndDisciplinaId(requester.getId(), turmaId, disciplinaId)) {
            return;
        }
        throw new AccessDeniedException("Sem permissão para esta disciplina nesta turma.");
    }

    // ! REFU: ids das turmas onde o professor leciona
    @Transactional(readOnly = true)
    public List<Long> turmaIdsDoProfessor(String requesterEmail) {
        User requester = findRequester(requesterEmail);
        return lecionamentoRepository.findByProfessorId(requester.getId()).stream()
                .map(Lecionamento::getTurma)
                .map(t -> t.getId())
                .distinct()
                .toList();
    }

    // ! REFU: turma atual do aluno (null se não tiver)
    private Long turmaIdDoAluno(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId));
        return student.getTurma() == null ? null : student.getTurma().getId();
    }

    // ! REFU: busca o usuário logado pelo e-mail
    private User findRequester(String requesterEmail) {
        return userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + requesterEmail));
    }
}
