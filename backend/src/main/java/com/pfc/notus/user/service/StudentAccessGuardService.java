package com.pfc.notus.user.service;

import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class StudentAccessGuardService {

    @Autowired
    private UserRepository userRepository;

    public void assertCanView(Long studentId, String requesterEmail) {
        User requester = findRequester(requesterEmail);

        if (requester.hasRole("ROLE_PROFESSOR") || requester.hasRole("ROLE_ADMIN")) return;
        if (requester.getId().equals(studentId)) return;
        if (requester instanceof Responsible responsavel
                && responsavel.getStudents().stream().anyMatch(s -> s.getId().equals(studentId))) {
            return;
        }
        throw new AccessDeniedException("Sem permissão para ver os dados deste aluno.");
    }

    public void assertCanViewResponsible(Long responsibleId, String requesterEmail) {
        User requester = findRequester(requesterEmail);

        if (requester.hasRole("ROLE_PROFESSOR") || requester.hasRole("ROLE_ADMIN")) return;
        if (requester.getId().equals(responsibleId)) return;
        throw new AccessDeniedException("Sem permissão para ver os alunos deste responsável.");
    }

    private User findRequester(String requesterEmail) {
        return userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + requesterEmail));
    }
}
