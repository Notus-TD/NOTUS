package com.pfc.notus.comunicado.service;

import com.pfc.notus.boletim.domain.AnoLetivo;
import com.pfc.notus.comunicado.domain.Comunicado;
import com.pfc.notus.comunicado.domain.PublicoComunicado;
import com.pfc.notus.comunicado.dto.ComunicadoDTO;
import com.pfc.notus.comunicado.dto.ComunicadoRequest;
import com.pfc.notus.comunicado.dto.RecadoProfessorRequest;
import com.pfc.notus.comunicado.repository.ComunicadoRepository;
import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import com.pfc.notus.notificacao.event.ComunicadoPublicadoEvent;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ComunicadoService {

    private static final Logger log = LoggerFactory.getLogger(ComunicadoService.class);

    private final ComunicadoRepository comunicadoRepository;
    private final LecionamentoRepository lecionamentoRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ComunicadoService(ComunicadoRepository comunicadoRepository, LecionamentoRepository lecionamentoRepository,
                            UserRepository userRepository, ApplicationEventPublisher eventPublisher) {
        this.comunicadoRepository = comunicadoRepository;
        this.lecionamentoRepository = lecionamentoRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public ComunicadoDTO publicar(ComunicadoRequest request, String autorEmail) {
        Comunicado comunicado = comunicadoRepository.save(new Comunicado(
                request.titulo().trim(), request.texto().trim(), request.publico(), autorEmail,
                LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS)));
        log.info(AuditMarker.AUDIT, "Comunicado {} publicado para {} por {}", comunicado.getId(), comunicado.getPublico(), autorEmail);
        if (comunicado.incluiResponsaveis()) {
            eventPublisher.publishEvent(new ComunicadoPublicadoEvent(comunicado.getId()));
        }
        return ComunicadoDTO.from(comunicado);
    }

    @Transactional
    public ComunicadoDTO publicarRecado(RecadoProfessorRequest request, String autorEmail) {
        var professor = userRepository.findByEmail(autorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Professor não encontrado"));

        if (!lecionamentoRepository.existsByProfessorIdAndTurmaId(professor.getId(), request.turmaId())) {
            throw new AccessDeniedException("Você não pode publicar recado para esta turma");
        }

        Comunicado recado = comunicadoRepository.save(new Comunicado(
                request.titulo().trim(), request.texto().trim(), autorEmail,
                LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS), request.turmaId()));
        log.info(AuditMarker.AUDIT, "Recado {} publicado para turma {} por professor {}", recado.getId(), request.turmaId(), autorEmail);
        eventPublisher.publishEvent(new ComunicadoPublicadoEvent(recado.getId()));
        return ComunicadoDTO.from(recado);
    }

    @Transactional(readOnly = true)
    public List<ComunicadoDTO> listarTodos() {
        return comunicadoRepository.findByAnoLetivoOrderByEnviadoEmDesc(AnoLetivo.atual()).stream()
                .map(ComunicadoDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ComunicadoDTO> listarParaUsuario(UserDetails usuario) {
        Set<String> papeis = usuario.getAuthorities().stream().map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
        if (papeis.contains("ROLE_ADMIN")) return listarTodos();

        EnumSet<PublicoComunicado> publicos = EnumSet.of(PublicoComunicado.TODOS);
        if (papeis.contains("ROLE_ALUNO")) publicos.add(PublicoComunicado.ALUNOS);
        if (papeis.contains("ROLE_RESPONSAVEL")) publicos.add(PublicoComunicado.RESPONSAVEIS);
        if (papeis.contains("ROLE_PROFESSOR")) publicos.add(PublicoComunicado.PROFESSORES);
        Set<Long> turmas = turmasDoUsuario(usuario.getUsername());
        return comunicadoRepository.findByPublicoInAndAnoLetivoOrderByEnviadoEmDesc(publicos, AnoLetivo.atual()).stream()
                .filter(c -> c.getTurmaId() == null || turmas.contains(c.getTurmaId()))
                .map(ComunicadoDTO::from).toList();
    }

    private Set<Long> turmasDoUsuario(String email) {
        User usuario = userRepository.findByEmail(email).orElse(null);
        if (usuario instanceof Responsible responsavel) {
            return responsavel.getStudents().stream()
                    .filter(s -> s.getTurma() != null)
                    .map(s -> s.getTurma().getId())
                    .collect(Collectors.toSet());
        }
        if (usuario instanceof Student aluno && aluno.getTurma() != null) {
            return Set.of(aluno.getTurma().getId());
        }
        return Set.of();
    }
}
