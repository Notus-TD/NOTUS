package com.pfc.notus.atividade.service;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.calendario.service.CalendarioService;
import com.pfc.notus.atividade.domain.Atividade;
import com.pfc.notus.atividade.dto.AtividadeDTO;
import com.pfc.notus.atividade.repository.AtividadeRepository;
import com.pfc.notus.boletim.domain.AnoLetivo;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisciplinaRepository;
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
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AtividadeService {

    private final AtividadeRepository atividadeRepository;

    private final TurmaRepository turmaRepository;

    private final DisciplinaRepository disciplinaRepository;

    private final LecionamentoRepository lecionamentoRepository;

    private final UserRepository userRepository;

    private final EntregaRepository entregaRepository;

    private final StudentAccessGuardService studentAccessGuardService;

    private final NotificacaoService notificacaoService;

    private final ApplicationEventPublisher eventPublisher;

    private final CalendarioService calendarioService;

    @Transactional
    public List<AtividadeDTO> getAllAtividade() {
        return atividadeRepository.findAll().stream().map(a -> toDTO(a, null)).toList();
    }

    @Transactional
    public List<AtividadeDTO> getByTurma(Long turmaId, String requesterEmail) {
        studentAccessGuardService.assertCanViewTurma(turmaId, requesterEmail);
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada com o id: " + turmaId));
        return atividadeRepository.findByTurmaIdAndAnoLetivoOrderByPrazoAsc(turmaId, AnoLetivo.daTurma(turma)).stream()
                .map(a -> toDTO(a, null))
                .toList();
    }

    @Transactional
    public List<AtividadeDTO> getMinhas(String requesterEmail) {
        User requester = buscarUsuario(requesterEmail);
        if (!(requester instanceof Student aluno)) {
            return List.of();
        }
        return atividadesComEntrega(aluno);
    }

    @Transactional
    public List<AtividadeDTO> getDoAluno(Long studentId, String requesterEmail) {
        studentAccessGuardService.assertCanView(studentId, requesterEmail);
        User usuario = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId));
        if (!(usuario instanceof Student aluno)) {
            throw new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId);
        }
        return atividadesComEntrega(aluno);
    }

    private List<AtividadeDTO> atividadesComEntrega(Student aluno) {
        if (aluno.getTurma() == null) {
            return List.of();
        }
        Set<Long> entregues = entregaRepository.findByStudentId(aluno.getId()).stream()
                .filter(e -> e.getStatus() == StatusEntrega.ENTREGUE || e.getStatus() == StatusEntrega.ATRASADA)
                .map(e -> e.getAtividade().getId())
                .collect(Collectors.toSet());
        LocalDate desde = aluno.getTurmaDesde();
        return atividadeRepository.findByTurmaIdAndAnoLetivoOrderByPrazoAsc(
                        aluno.getTurma().getId(), AnoLetivo.doAluno(aluno)).stream()
                .filter(a -> desde == null || !a.getPrazo().isBefore(desde))
                .map(a -> toDTO(a, entregues.contains(a.getId())))
                .toList();
    }

    @Transactional
    public AtividadeDTO publicar(AtividadeDTO dto, String requesterEmail) {
        if (dto.prazo().isBefore(LocalDate.now())) {
            throw new RegraNegocioException("O prazo da atividade não pode ser uma data passada.");
        }
        exigirBimestre(dto);
        validarPontos(dto.pontos());
        User requester = buscarUsuario(requesterEmail);
        Turma turma = turmaRepository.findById(dto.turmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada com o id: " + dto.turmaId()));
        calendarioService.exigirBimestreAberto(AnoLetivo.daTurma(turma), dto.bimestre());

        Atividade entity = new Atividade();
        preencher(entity, dto);
        entity.setPublicadaEm(LocalDateTime.now());
        entity.setTurma(turma);
        entity.setDisciplina(resolverDisciplina(requester, turma.getId(), dto.disciplinaId()));
        entity.setAnoLetivo(AnoLetivo.daTurma(turma));
        entity = atividadeRepository.save(entity);
        eventPublisher.publishEvent(new AtividadePublicadaEvent(entity.getId()));
        return toDTO(entity, null);
    }

    @Transactional
    public AtividadeDTO atualizar(Long id, AtividadeDTO dto, String requesterEmail) {
        Atividade atividade = atividadeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Atividade não encontrada com o id: " + id));
        exigirQueLeciona(atividade, requesterEmail, "Sem permissão para editar esta atividade.");
        exigirBimestre(dto);
        String anoLetivo = AnoLetivo.daTurma(atividade.getTurma());
        calendarioService.exigirBimestreAberto(anoLetivo, atividade.getBimestre());
        calendarioService.exigirBimestreAberto(anoLetivo, dto.bimestre());
        if (!dto.prazo().equals(atividade.getPrazo()) && dto.prazo().isBefore(LocalDate.now())) {
            throw new RegraNegocioException("O prazo da atividade não pode ser uma data passada.");
        }
        validarPontos(dto.pontos());
        exigirEntregasDentroDoNovoValor(id, dto.pontos());

        preencher(atividade, dto);
        return toDTO(atividadeRepository.save(atividade), null);
    }

    @Transactional
    public void delete(Long id, String requesterEmail) {
        Atividade atividade = atividadeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Atividade não encontrada com o id: " + id));
        exigirQueLeciona(atividade, requesterEmail, "Sem permissão para excluir esta atividade.");
        calendarioService.exigirBimestreAberto(AnoLetivo.daTurma(atividade.getTurma()), atividade.getBimestre());
        if (entregaRepository.existsByAtividadeId(id)) {
            throw new ConflictException("A atividade já tem entregas e não pode ser excluída.");
        }
        atividadeRepository.delete(atividade);
        notificacaoService.cancelarPorReferencia(NotificacaoService.REF_ATIVIDADE, id, "Atividade excluída antes do envio");
    }

    private void preencher(Atividade atividade, AtividadeDTO dto) {
        atividade.setTitle(dto.title().trim());
        atividade.setContent(dto.content().trim());
        atividade.setBimestre(dto.bimestre());
        atividade.setPrazo(dto.prazo());
        atividade.setPontos(dto.pontos());
    }

    private static void exigirBimestre(AtividadeDTO dto) {
        if (dto.bimestre() == null) {
            throw new RegraNegocioException("Informe o bimestre da atividade.");
        }
    }

    /** Pontos são opcionais; se vierem, ficam entre 0 (exclusive) e 10. */
    private static void validarPontos(Float pontos) {
        if (pontos != null && (pontos.isNaN() || pontos <= 0 || pontos > 10)) {
            throw new RegraNegocioException("Os pontos da atividade devem ser maiores que 0 e no máximo 10.");
        }
    }

    /** Admin sempre pode; professor só se leciona a disciplina da atividade naquela turma. */
    private void exigirQueLeciona(Atividade atividade, String requesterEmail, String mensagem) {
        User requester = buscarUsuario(requesterEmail);
        boolean pode = requester.hasRole("ROLE_ADMIN")
                || (requester.hasRole("ROLE_PROFESSOR") && lecionamentoRepository.existsByProfessorIdAndTurmaIdAndDisciplinaId(
                        requester.getId(), atividade.getTurma().getId(), atividade.getDisciplina().getId()));
        if (!pode) {
            throw new AccessDeniedException(mensagem);
        }
    }

    /** Baixar o valor da atividade não pode deixar entrega com mais pontos do que ela vale. */
    private void exigirEntregasDentroDoNovoValor(Long atividadeId, Float pontos) {
        float novoMaximo = pontos == null ? 0f : pontos;
        boolean entregaAcima = entregaRepository.findByAtividadeId(atividadeId).stream()
                .anyMatch(e -> e.getPontosObtidos() != null && e.getPontosObtidos() > novoMaximo);
        if (entregaAcima) {
            throw new ConflictException("Há entregas com mais pontos do que o novo valor da atividade. "
                    + "Ajuste os pontos dessas entregas antes.");
        }
    }

    /** Admin escolhe qualquer disciplina; professor só as que leciona na turma. */
    private Disciplina resolverDisciplina(User requester, Long turmaId, Long disciplinaId) {
        if (requester.hasRole("ROLE_ADMIN")) {
            return disciplinaDoAdmin(disciplinaId);
        }
        if (requester.hasRole("ROLE_PROFESSOR")) {
            return disciplinaDoProfessor(requester.getId(), turmaId, disciplinaId);
        }
        throw new AccessDeniedException("Sem permissão para publicar atividades.");
    }

    private Disciplina disciplinaDoAdmin(Long disciplinaId) {
        if (disciplinaId == null) {
            throw new RegraNegocioException("Informe a disciplina da atividade.");
        }
        return disciplinaRepository.findById(disciplinaId)
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + disciplinaId));
    }

    /** Se o professor tem uma disciplina só na turma, ela é usada quando o formulário não informa. */
    private Disciplina disciplinaDoProfessor(Long professorId, Long turmaId, Long disciplinaId) {
        List<Disciplina> disciplinasNaTurma = lecionamentoRepository.findByProfessorId(professorId).stream()
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
                entregue,
                entity.getPontos()
        );
    }
}
