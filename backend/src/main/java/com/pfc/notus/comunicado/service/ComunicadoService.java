package com.pfc.notus.comunicado.service;

import com.pfc.notus.comunicado.domain.Comunicado;
import com.pfc.notus.comunicado.domain.PublicoComunicado;
import com.pfc.notus.comunicado.dto.ComunicadoDTO;
import com.pfc.notus.comunicado.dto.ComunicadoRequest;
import com.pfc.notus.comunicado.repository.ComunicadoRepository;
import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.notificacao.event.ComunicadoPublicadoEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
public class ComunicadoService {

    private static final Logger log = LoggerFactory.getLogger(ComunicadoService.class);

    private final ComunicadoRepository comunicadoRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ComunicadoService(ComunicadoRepository comunicadoRepository, ApplicationEventPublisher eventPublisher) {
        this.comunicadoRepository = comunicadoRepository;
        this.eventPublisher = eventPublisher;
    }

    /** Salva o comunicado; se o público inclui responsáveis, eles recebem aviso por e-mail após o commit. */
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

    @Transactional(readOnly = true)
    public List<ComunicadoDTO> listarTodos() {
        return comunicadoRepository.findAllByOrderByEnviadoEmDesc().stream().map(ComunicadoDTO::from).toList();
    }

    /** Comunicados que o usuário logado pode ver: os de toda a escola e os do seu perfil. */
    @Transactional(readOnly = true)
    public List<ComunicadoDTO> listarParaUsuario(UserDetails usuario) {
        Set<String> papeis = usuario.getAuthorities().stream().map(GrantedAuthority::getAuthority)
                .collect(java.util.stream.Collectors.toSet());
        if (papeis.contains("ROLE_ADMIN")) return listarTodos();

        EnumSet<PublicoComunicado> publicos = EnumSet.of(PublicoComunicado.TODOS);
        if (papeis.contains("ROLE_ALUNO")) publicos.add(PublicoComunicado.ALUNOS);
        if (papeis.contains("ROLE_RESPONSAVEL")) publicos.add(PublicoComunicado.RESPONSAVEIS);
        if (papeis.contains("ROLE_PROFESSOR")) publicos.add(PublicoComunicado.PROFESSORES);
        return comunicadoRepository.findByPublicoInOrderByEnviadoEmDesc(publicos).stream()
                .map(ComunicadoDTO::from).toList();
    }
}
