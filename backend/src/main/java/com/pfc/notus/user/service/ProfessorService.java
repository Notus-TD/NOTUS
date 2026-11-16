package com.pfc.notus.user.service;

import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import com.pfc.notus.user.domain.Professor;
import com.pfc.notus.user.dto.ProfessorDTO;
import com.pfc.notus.user.dto.ProfessorRequest;
import com.pfc.notus.user.repository.ProfessorRepository;
import com.pfc.notus.user.repository.TokenSenhaRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfessorService {

    private static final Logger log = LoggerFactory.getLogger(ProfessorService.class);

    private final ProfessorRepository professorRepository;
    private final UserService userService;
    private final LecionamentoRepository lecionamentoRepository;
    private final TokenSenhaRepository tokenSenhaRepository;

    @Transactional
    public ProfessorDTO createProfessor(ProfessorRequest dto) {
        Professor professor = new Professor(dto.fullName(), dto.email());
        professor = (Professor) userService.register(professor, "ROLE_PROFESSOR");
        return ProfessorDTO.of(professor);
    }

    @Transactional(readOnly = true)
    public List<ProfessorDTO> listProfessors() {
        return professorRepository.findAll(Sort.by("fullName")).stream()
                .filter(p -> p.getAnonimizadoEm() == null)
                .map(ProfessorDTO::of)
                .toList();
    }

    /**
     * Professor que saiu da escola: bloqueia o login (inclusive a sessão aberta), remove os vínculos com turmas e
     * disciplinas, zera o MFA e invalida os links de senha abertos. O nome continua no histórico do que ele lançou.
     */
    @Transactional
    public ProfessorDTO desligar(Long id, String adminEmail) {
        Professor professor = professorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Professor não encontrado com o id: " + id));
        if (!professor.isAtivo()) {
            throw new ConflictException("Este professor já está desligado.");
        }

        professor.desligar();
        long vinculos = lecionamentoRepository.deleteByProfessorId(id);
        tokenSenhaRepository.encerrarAbertos(id, LocalDateTime.now());

        log.info(AuditMarker.AUDIT, "Professor {} desligado por {} ({} vínculos removidos)", id, adminEmail, vinculos);
        return ProfessorDTO.of(professor);
    }
}
