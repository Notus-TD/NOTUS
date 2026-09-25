package com.pfc.notus.notificacao.service;

import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.falta.domain.FaltaDomain;
import com.pfc.notus.notificacao.domain.Notificacao;
import com.pfc.notus.notificacao.domain.StatusNotificacao;
import com.pfc.notus.notificacao.domain.TipoNotificacao;
import com.pfc.notus.notificacao.dto.NotificacaoDTO;
import com.pfc.notus.notificacao.repository.NotificacaoRepository;
import com.pfc.notus.notificacao.util.TelefoneUtil;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class NotificacaoService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoService.class);
    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Locale PT_BR = Locale.of("pt", "BR");

    public static final String REF_FALTA = "FALTA";
    public static final String REF_BOLETIM = "BOLETIM";
    public static final String REF_ATIVIDADE = "ATIVIDADE";

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @Autowired
    private TemplateRegistry templateRegistry;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public void notificarFalta(FaltaDomain falta, int totalFaltasNaDisciplina) {
        Student aluno = falta.getAluno();
        Responsible responsavel = aluno.getResponsible();
        if (!elegivel(responsavel, aluno)) return;

        String chave = "FALTA:%d:%d:%s".formatted(aluno.getId(), falta.getDisciplina().getId(), falta.getData());
        List<String> variaveis = templateRegistry.variaveis(TipoNotificacao.FALTA,
                responsavel.getName(),
                aluno.getFullName(),
                falta.getDisciplina().getTitle(),
                falta.getData().format(DATA_BR),
                String.valueOf(totalFaltasNaDisciplina));

        criar(TipoNotificacao.FALTA, responsavel, aluno, REF_FALTA, falta.getId(), chave, variaveis);
    }

    @Transactional
    public void notificarBoletimFechado(Boletim boletim) {
        Student aluno = boletim.getStudent();
        Responsible responsavel = aluno.getResponsible();
        if (!elegivel(responsavel, aluno)) return;

        String chave = "BOLETIM:%d:%s".formatted(boletim.getId(), boletim.getFechadoEm());
        float media = boletim.getFinalAverage() == null ? 0f : boletim.getFinalAverage();
        List<String> variaveis = templateRegistry.variaveis(TipoNotificacao.BOLETIM_FECHADO,
                responsavel.getName(),
                aluno.getFullName(),
                boletim.getPeriod(),
                String.format(PT_BR, "%.1f", media));

        criar(TipoNotificacao.BOLETIM_FECHADO, responsavel, aluno, REF_BOLETIM, boletim.getId(), chave, variaveis);
    }

    @Transactional
    public void notificarAtividade(Long atividadeId, Collection<Student> alunosDaTurma,
                                   String disciplina, String titulo, LocalDate prazo) {
        Map<Long, Student> primeiroAlunoPorResponsavel = new LinkedHashMap<>();
        for (Student aluno : alunosDaTurma) {
            Responsible responsavel = aluno.getResponsible();
            if (elegivel(responsavel, aluno)) {
                primeiroAlunoPorResponsavel.putIfAbsent(responsavel.getId(), aluno);
            }
        }

        for (Student aluno : primeiroAlunoPorResponsavel.values()) {
            Responsible responsavel = aluno.getResponsible();
            String chave = "ATIVIDADE:%d:%d".formatted(atividadeId, responsavel.getId());
            List<String> variaveis = templateRegistry.variaveis(TipoNotificacao.ATIVIDADE,
                    responsavel.getName(),
                    aluno.getFullName(),
                    disciplina,
                    titulo,
                    prazo == null ? "sem prazo" : prazo.format(DATA_BR));
            criar(TipoNotificacao.ATIVIDADE, responsavel, aluno, REF_ATIVIDADE, atividadeId, chave, variaveis);
        }
    }

    @Transactional
    public void cancelarPorReferencia(String referenciaTipo, Long referenciaId, String motivo) {
        int canceladas = notificacaoRepository.cancelarPorReferencia(
                StatusNotificacao.PENDENTE, StatusNotificacao.CANCELADA, referenciaTipo, referenciaId, motivo);
        if (canceladas > 0) {
            log.info(AuditMarker.AUDIT, "Notificações canceladas | {}:{} | {} | {}", referenciaTipo, referenciaId, canceladas, motivo);
        }
    }

    @Transactional
    public void cancelarPendentesDoResponsavel(Long responsavelId, String motivo) {
        int canceladas = notificacaoRepository.cancelarPorResponsavel(
                StatusNotificacao.PENDENTE, StatusNotificacao.CANCELADA, responsavelId, motivo);
        if (canceladas > 0) {
            log.info(AuditMarker.AUDIT, "Notificações canceladas | responsável {} | {} | {}", responsavelId, canceladas, motivo);
        }
    }

    @Transactional
    public void cancelarPendentesDoAluno(Long studentId, String motivo) {
        int canceladas = notificacaoRepository.cancelarPorAluno(
                StatusNotificacao.PENDENTE, StatusNotificacao.CANCELADA, studentId, motivo);
        if (canceladas > 0) {
            log.info(AuditMarker.AUDIT, "Notificações canceladas | aluno {} | {} | {}", studentId, canceladas, motivo);
        }
    }

    @Transactional(readOnly = true)
    public List<NotificacaoDTO> listar(TipoNotificacao tipo, StatusNotificacao status, Long responsavelId,
                                       LocalDate de, LocalDate ate) {
        LocalDateTime inicio = de == null ? LocalDateTime.of(1970, 1, 1, 0, 0) : de.atStartOfDay();
        LocalDateTime fim = ate == null ? LocalDateTime.of(9999, 12, 31, 0, 0) : ate.plusDays(1).atStartOfDay();
        return notificacaoRepository.buscar(tipo, status, responsavelId, inicio, fim).stream()
                .map(NotificacaoDTO::from)
                .toList();
    }

    @Transactional
    public NotificacaoDTO reenviar(Long id) {
        Notificacao notificacao = notificacaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada com o id: " + id));
        if (notificacao.getStatus() != StatusNotificacao.FALHA) {
            throw new ConflictException("Só é possível reenviar notificações com status FALHA (atual: " + notificacao.getStatus() + ")");
        }
        notificacao.setStatus(StatusNotificacao.PENDENTE);
        notificacao.setTentativas(0);
        notificacao.setErro(null);
        notificacao.setProximaTentativaEm(LocalDateTime.now());
        log.info(AuditMarker.AUDIT, "Notificação {} recolocada na fila (reenvio manual)", id);
        return NotificacaoDTO.from(notificacao);
    }

    public String motivoBloqueio(Responsible responsavel, Student aluno) {
        if (responsavel == null) return "Aluno sem responsável cadastrado";
        if (!responsavel.isAtivo()) return "Responsável inativo ou anonimizado";
        if (!responsavel.isWhatsappOptIn()) return "Responsável sem opt-in de WhatsApp";
        if (!TelefoneUtil.isValido(responsavel.getPhone())) return "Telefone do responsável inválido";
        if (aluno != null && aluno.getStatusMatricula() != StatusMatricula.ATIVA) return "Matrícula do aluno não está ativa";
        return null;
    }

    private boolean elegivel(Responsible responsavel, Student aluno) {
        String motivo = motivoBloqueio(responsavel, aluno);
        if (motivo != null) {
            log.debug("Notificação não criada para o aluno {}: {}", aluno == null ? null : aluno.getId(), motivo);
            return false;
        }
        return true;
    }

    private void criar(TipoNotificacao tipo, Responsible responsavel, Student aluno, String referenciaTipo,
                       Long referenciaId, String chave, List<String> variaveis) {
        if (notificacaoRepository.existsByChaveIdempotencia(chave)) {
            log.debug("Notificação ignorada, chave já existe: {}", chave);
            return;
        }
        String template = templateRegistry.template(tipo).nome();
        Notificacao notificacao = new Notificacao(tipo, responsavel, aluno, referenciaTipo, referenciaId,
                chave, template, objectMapper.writeValueAsString(variaveis));
        notificacao = notificacaoRepository.save(notificacao);
        log.info(AuditMarker.AUDIT, "Notificação {} criada | {} | responsável {} | {}",
                notificacao.getId(), tipo, responsavel.getId(), TelefoneUtil.mascarar(responsavel.getPhone()));
    }
}
