package com.pfc.notus.user.service;

import com.pfc.notus.user.domain.Professor;
import com.pfc.notus.user.dto.ProfessorDTO;
import com.pfc.notus.user.dto.ProfessorRequest;
import com.pfc.notus.user.repository.ProfessorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProfessorService {

    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    private UserService userService;

    // Mesma regra do aluno e do responsável: no primeiro acesso a senha é o próprio e-mail.
    @Transactional
    public ProfessorDTO createProfessor(ProfessorRequest dto) {
        Professor professor = new Professor(dto.fullName().trim(), dto.email().trim());
        professor = (Professor) userService.register(professor, "ROLE_PROFESSOR");
        return toDTO(professor);
    }

    @Transactional(readOnly = true)
    public List<ProfessorDTO> listProfessors() {
        return professorRepository.findAll(Sort.by("fullName")).stream()
                .filter(p -> p.getAnonimizadoEm() == null)
                .map(ProfessorService::toDTO)
                .toList();
    }

    private static ProfessorDTO toDTO(Professor p) {
        return new ProfessorDTO(p.getId(), p.getFullName(), p.getEmail());
    }
}
