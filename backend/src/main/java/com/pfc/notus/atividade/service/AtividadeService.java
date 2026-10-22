package com.pfc.notus.atividade.service;

import com.pfc.notus.atividade.domain.Atividade;
import com.pfc.notus.atividade.dto.AtividadeDTO;
import com.pfc.notus.atividade.repository.AtividadeRepository;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.entrega.domain.StatusEntrega;
import com.pfc.notus.entrega.repository.EntregaRepository;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.lecionamento.domain.Lecionamento;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import com.pfc.notus.notificacao.event.AtividadePublicadaEvent;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.repository.TurmaRepository;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AtividadeService {

    @Autowired
    private AtividadeRepository atividadeRepository;

    @Autowired
    private TurmaRepository turmaRepository;

    @Autowired
    private DisiciplinaRepository disciplinaRepository;

    @Autowired
    private LecionamentoRepository lecionamentoRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntregaRepository entregaRepository;

    @Autowired
    private StudentAccessGuardService studentAccessGuardService;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Transactional
    public List<AtividadeDTO> getAllAtividade() {
        return atividadeRepository.findAll().stream().map(a -> toDTO(a, null)).toList();
    }

    @Transactional
    public List<AtividadeDTO> getByTurma(Long turmaId, String requesterEmail) {
        studentAccessGuardService.assertCanViewTurma(turmaId, requesterEmail);
        return atividadeRepository.findByTurmaIdOrderByPrazoAsc(turmaId).stream()
                .map(a -> toDTO(a, null))
                .toList();
    }

    @Transactional
    public List<AtividadeDTO> getMinhas(String requesterEmail) {
        User requester = buscarUsuario(requesterEmail);
        if (!(requester instanceof Student aluno) || aluno.getTurma() == null) {
            return List.of();
        }
        Set<Long> entregues = entregaRepository.findByStudentId(aluno.getId()).stream()
                .filter(e -> e.getStatus() == StatusEntrega.ENTREGUE || e.getStatus() == StatusEntrega.ATRASADA)
                .map(e -> e.getAtividade().getId())
                .collect(Collectors.toSet());
        return atividadeRepository.findByTurmaIdOrderByPrazoAsc(aluno.getTurma().getId()).stream()
                .map(a -> toDTO(a, entregues.contains(a.getId())))
                .toList();
    }

    @Transactional
    public AtividadeDTO publicar(AtividadeDTO dto, String requesterEmail) {
        if (dto.prazo().isBefore(LocalDate.now())) {
            throw new RegraNegocioException("O prazo da atividade não pode ser uma data passada.");
        }
        if (dto.bimestre() == null) {
            throw new RegraNegocioException("Informe o bimestre da atividade.");
        }
        User requester = buscarUsuario(requesterEmail);
        Turma turma = turmaRepository.findById(dto.turmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada com o id: " + dto.turmaId()));
        Disciplina disciplina = resolverDisciplina(requester, turma.getId(), dto.disciplinaId());

        Atividade entity = new Atividade();
        entity.setTitle(dto.title().trim());
        entity.setContent(dto.content().trim());
        entity.setBimestre(dto.bimestre());
        entity.setPrazo(dto.prazo());
        entity.setPublicadaEm(LocalDateTime.now());
        entity.setTurma(turma);
        entity.setDisciplina(disciplina);

        entity = atividadeRepository.save(entity);
        eventPublisher.publishEvent(new AtividadePublicadaEvent(entity.getId()));
        return toDTO(entity, null);
    }

    @Transactional
    public void delete(Long id, String requesterEmail) {
        Atividade atividade = atividadeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Atividade não encontrada com o id: " + id));
        User requester = buscarUsuario(requesterEmail);
        boolean podeExcluir = requester.hasRole("ROLE_ADMIN")
                || (requester.hasRole("ROLE_PROFESSOR") && lecionamentoRepository.existsByProfessorIdAndTurmaIdAndDisciplinaId(
                        requester.getId(), atividade.getTurma().getId(), atividade.getDisciplina().getId()));
        if (!podeExcluir) {
            throw new AccessDeniedException("Sem permissão para excluir esta atividade.");
        }
        if (entregaRepository.existsByAtividadeId(id)) {
            throw new ConflictException("A atividade já tem entregas e não pode ser excluída.");
        }
        atividadeRepository.delete(atividade);
        notificacaoService.cancelarPorReferencia(NotificacaoService.REF_ATIVIDADE, id, "Atividade excluída antes do envio");
    }

    private Disciplina resolverDisciplina(User requester, Long turmaId, Long disciplinaId) {
        if (requester.hasRole("ROLE_ADMIN")) {
            if (disciplinaId == null) {
                throw new RegraNegocioException("Informe a disciplina da atividade.");
            }
            return disciplinaRepository.findById(disciplinaId)
                    .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + disciplinaId));
        }
        if (requester.hasRole("ROLE_PROFESSOR")) {
            List<Disciplina> disciplinasNaTurma = lecionamentoRepository.findByProfessorId(requester.getId()).stream()
                    .filter(l -> l.getTurma().getId().equals(turmaId))
                    .map(Lecionamento::getDisciplina)
                    .toList();

            if (disciplinasNaTurma.isEmpty()) {
                throw new AccessDeniedException("Você não leciona nesta turma.");
            }
            if (disciplinaId == null && disciplinasNaTurma.size() > 1) {
                throw new RegraNegocioException("Informe a disciplina da atividade.");
            }
            if (disciplinaId == null) {
                return disciplinasNaTurma.getFirst();
            }
            return disciplinasNaTurma.stream()
                    .filter(d -> d.getId().equals(disciplinaId))
                    .findFirst()
                    .orElseThrow(() -> new AccessDeniedException("Você só pode publicar atividades das disciplinas que leciona nesta turma."));
        }
        throw new AccessDeniedException("Sem permissão para publicar atividades.");
    }

    private User buscarUsuario(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + email));
    }

    private AtividadeDTO toDTO(Atividade entity, Boolean entregue) {
        return new AtividadeDTO(
                entity.getId(),
                entity.getTitle(),
                entity.getContent(),
                entity.getBimestre(),
                entity.getPrazo(),
                entity.getTurma().getId(),
                entity.getDisciplina().getId(),
                entity.getTurma().getName(),
                entity.getDisciplina().getTitle(),
                entity.getPublicadaEm(),
                entregue
        );
    }
}
