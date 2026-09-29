package com.pfc.notus.user.service;

import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.lecionamento.domain.Lecionamento;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Regras de acesso a dados de alunos. Admin vê tudo; professor só enxerga alunos
 * das turmas em que leciona (tb_lecionamento); aluno e responsável só os próprios.
 */
@Service
public class StudentAccessGuardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private LecionamentoRepository lecionamentoRepository;

    @Transactional(readOnly = true)
    public void assertCanView(Long studentId, String requesterEmail) {
        User requester = findRequester(requesterEmail);

        if (requester.hasRole("ROLE_ADMIN")) return;
        if (requester.hasRole("ROLE_PROFESSOR")) {
            Long turmaId = turmaIdDoAluno(studentId);
            if (turmaId != null && lecionamentoRepository.existsByProfessorIdAndTurmaId(requester.getId(), turmaId)) {
                return;
            }
            throw new AccessDeniedException("Sem permissão para ver os dados deste aluno.");
        }
        if (requester.getId().equals(studentId)) return;
        if (requester instanceof Responsible responsavel
                && responsavel.getStudents().stream().anyMatch(s -> s.getId().equals(studentId))) {
            return;
        }
        throw new AccessDeniedException("Sem permissão para ver os dados deste aluno.");
    }

    @Transactional(readOnly = true)
    public void assertCanViewResponsible(Long responsibleId, String requesterEmail) {
        User requester = findRequester(requesterEmail);

        if (requester.hasRole("ROLE_ADMIN")) return;
        if (requester.getId().equals(responsibleId)) return;
        throw new AccessDeniedException("Sem permissão para ver os alunos deste responsável.");
    }

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

    /** Lançar nota/falta: professor precisa lecionar a disciplina na turma do aluno. */
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

    @Transactional(readOnly = true)
    public void assertCanTeachDisciplina(Long disciplinaId, String requesterEmail) {
        User requester = findRequester(requesterEmail);

        if (requester.hasRole("ROLE_ADMIN")) return;
        if (requester.hasRole("ROLE_PROFESSOR")
                && lecionamentoRepository.existsByProfessorIdAndDisciplinaId(requester.getId(), disciplinaId)) {
            return;
        }
        throw new AccessDeniedException("Sem permissão para registrar aulas desta disciplina.");
    }

    /** Ids das turmas em que o usuário (professor) leciona. */
    @Transactional(readOnly = true)
    public List<Long> turmaIdsDoProfessor(String requesterEmail) {
        User requester = findRequester(requesterEmail);
        return lecionamentoRepository.findByProfessorId(requester.getId()).stream()
                .map(Lecionamento::getTurma)
                .map(t -> t.getId())
                .distinct()
                .toList();
    }

    private Long turmaIdDoAluno(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId));
        return student.getTurma() == null ? null : student.getTurma().getId();
    }

    private User findRequester(String requesterEmail) {
        return userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + requesterEmail));
    }
}
