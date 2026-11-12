package com.pfc.notus.notificacao.service;

import com.pfc.notus.atividade.domain.Atividade;
import com.pfc.notus.atividade.repository.AtividadeRepository;
import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.comunicado.domain.Comunicado;
import com.pfc.notus.comunicado.repository.ComunicadoRepository;
import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.falta.domain.FaltaDomain;
import com.pfc.notus.falta.repository.FaltaRepository;
import com.pfc.notus.notificacao.domain.Notificacao;
import com.pfc.notus.notificacao.domain.StatusNotificacao;
import com.pfc.notus.notificacao.domain.TipoNotificacao;
import com.pfc.notus.notificacao.dto.AvisoDTO;
import com.pfc.notus.notificacao.dto.NotificacaoDTO;
import com.pfc.notus.notificacao.repository.NotificacaoRepository;
import com.pfc.notus.notificacao.util.EmailUtil;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.repository.ResponsibleRepository;
import com.pfc.notus.user.repository.StudentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
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
import java.util.Objects;

@Service
public class NotificacaoService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoService.class);
    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Locale PT_BR = Locale.of("pt", "BR");

    public static final String REF_FALTA = "FALTA";
    public static final String REF_BOLETIM = "BOLETIM";
    public static final String REF_ATIVIDADE = "ATIVIDADE";
    public static final String REF_COMUNICADO = "COMUNICADO";
    public static final int MESES_RETENCAO = 6;

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @Autowired
    private TemplateRegistry templateRegistry;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FaltaRepository faltaRepository;

    @Autowired
    private BoletimRepository boletimRepository;

    @Autowired
    private AtividadeRepository atividadeRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ComunicadoRepository comunicadoRepository;

    @Autowired
    private ResponsibleRepository responsibleRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notificarFalta(Long faltaId, int totalFaltasNaDisciplina) {
        FaltaDomain falta = faltaRepository.findById(faltaId).orElse(null);
        if (falta == null) {
            log.warn("Falta {} não encontrada ao criar a notificação", faltaId);
            return;
        }
        Student aluno = falta.getAluno();
        Responsible responsavel = aluno.getResponsible();

        String chave = "FALTA:%d:%d:%s".formatted(aluno.getId(), falta.getDisciplina().getId(), falta.getData());

        // Notifica responsável (se elegível)
        if (elegivel(responsavel, aluno)) {
            List<String> variaveisResponsavel = templateRegistry.variaveis(TipoNotificacao.FALTA,
                    responsavel.getName(),
                    aluno.getFullName(),
                    falta.getDisciplina().getTitle(),
                    falta.getData().format(DATA_BR),
                    String.valueOf(totalFaltasNaDisciplina));
            criar(TipoNotificacao.FALTA, responsavel, aluno, REF_FALTA, falta.getId(), chave + ":RESPONSAVEL", variaveisResponsavel);
        }

        // Notifica aluno (se elegível)
        if (elegivelAluno(aluno)) {
            List<String> variaveisAluno = templateRegistry.variaveis(TipoNotificacao.FALTA,
                    aluno.getFullName(),
                    aluno.getFullName(),
                    falta.getDisciplina().getTitle(),
                    falta.getData().format(DATA_BR),
                    String.valueOf(totalFaltasNaDisciplina));
            criar(TipoNotificacao.FALTA, null, aluno, REF_FALTA, falta.getId(), chave + ":ALUNO", variaveisAluno);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notificarNotaFinal(Long boletimId, boolean atualizada) {
        Boletim boletim = boletimRepository.findById(boletimId).orElse(null);
        if (boletim == null) {
            log.warn("Nota final {} não encontrada ao criar a notificação", boletimId);
            return;
        }
        Student aluno = boletim.getStudent();
        Responsible responsavel = aluno.getResponsible();

        String chave = "NOTA_FINAL:%d:%s".formatted(boletim.getId(), boletim.getLancadoEm());

        // Notifica responsável (se elegível)
        if (elegivel(responsavel, aluno)) {
            List<String> variaveisResponsavel = templateRegistry.variaveis(TipoNotificacao.NOTA_FINAL,
                    responsavel.getName(),
                    aluno.getFullName(),
                    boletim.getDisciplina().getTitle(),
                    boletim.getBimestre().getDescricao(),
                    String.format(PT_BR, "%.1f", boletim.getNotaFinal()));
            criar(TipoNotificacao.NOTA_FINAL, atualizada ? "nota_atualizada" : null, responsavel, aluno,
                    REF_BOLETIM, boletim.getId(), chave + ":RESPONSAVEL", variaveisResponsavel);
        }

        // Notifica aluno (se elegível)
        if (elegivelAluno(aluno)) {
            List<String> variaveisAluno = templateRegistry.variaveis(TipoNotificacao.NOTA_FINAL,
                    aluno.getFullName(),
                    aluno.getFullName(),
                    boletim.getDisciplina().getTitle(),
                    boletim.getBimestre().getDescricao(),
                    String.format(PT_BR, "%.1f", boletim.getNotaFinal()));
            criar(TipoNotificacao.NOTA_FINAL, atualizada ? "nota_atualizada" : null, null, aluno,
                    REF_BOLETIM, boletim.getId(), chave + ":ALUNO", variaveisAluno);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notificarAtividadePublicada(Long atividadeId) {
        Atividade atividade = atividadeRepository.findById(atividadeId).orElse(null);
        if (atividade == null) {
            log.warn("Atividade {} não encontrada ao criar as notificações", atividadeId);
            return;
        }
        List<Student> alunosDaTurma = studentRepository.findByTurmaId(atividade.getTurma().getId(), Sort.unsorted());
        notificarAtividade(atividade.getId(), alunosDaTurma, atividade.getDisciplina().getTitle(),
                atividade.getTitle(), atividade.getPrazo());
    }

    @Transactional
    public void notificarAtividade(Long atividadeId, Collection<Student> alunosDaTurma,
                                   String disciplina, String titulo, LocalDate prazo) {
        // Agrupa responsáveis elegíveis
        Map<Long, Student> primeiroAlunoPorResponsavel = new LinkedHashMap<>();
        for (Student aluno : alunosDaTurma) {
            Responsible responsavel = aluno.getResponsible();
            if (elegivel(responsavel, aluno)) {
                primeiroAlunoPorResponsavel.putIfAbsent(responsavel.getId(), aluno);
            }
        }

        // Notifica responsáveis
        for (Student aluno : primeiroAlunoPorResponsavel.values()) {
            Responsible responsavel = aluno.getResponsible();
            String chaveBase = "ATIVIDADE:%d:%d".formatted(atividadeId, responsavel.getId());

            List<String> variaveisResponsavel = templateRegistry.variaveis(TipoNotificacao.ATIVIDADE,
                    responsavel.getName(),
                    aluno.getFullName(),
                    disciplina,
                    titulo,
                    prazo == null ? "sem prazo" : prazo.format(DATA_BR));
            criar(TipoNotificacao.ATIVIDADE, responsavel, aluno, REF_ATIVIDADE, atividadeId, chaveBase + ":RESPONSAVEL", variaveisResponsavel);
        }

        // Notifica alunos elegíveis
        for (Student aluno : alunosDaTurma) {
            if (elegivelAluno(aluno)) {
                String chaveBase = "ATIVIDADE:%d:%d".formatted(atividadeId, aluno.getId());
                List<String> variaveisAluno = templateRegistry.variaveis(TipoNotificacao.ATIVIDADE,
                        aluno.getFullName(),
                        aluno.getFullName(),
                        disciplina,
                        titulo,
                        prazo == null ? "sem prazo" : prazo.format(DATA_BR));
                criar(TipoNotificacao.ATIVIDADE, null, aluno, REF_ATIVIDADE, atividadeId, chaveBase + ":ALUNO", variaveisAluno);
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notificarComunicado(Long comunicadoId) {
        Comunicado comunicado = comunicadoRepository.findById(comunicadoId).orElse(null);
        if (comunicado == null) {
            log.warn("Comunicado {} não encontrado ao criar as notificações", comunicadoId);
            return;
        }
        List<Responsible> destinatarios = comunicado.getTurmaId() == null
                ? responsibleRepository.findAll()
                : responsaveisDaTurma(comunicado.getTurmaId());
        for (Responsible responsavel : destinatarios) {
            boolean temFilhoAtivo = responsavel.getStudents().stream()
                    .anyMatch(s -> s.getStatusMatricula() == StatusMatricula.ATIVA);
            if (!temFilhoAtivo || motivoBloqueio(responsavel, null) != null) continue;

            String chave = "COMUNICADO:%d:%d".formatted(comunicadoId, responsavel.getId());
            List<String> variaveis = templateRegistry.variaveis(TipoNotificacao.COMUNICADO,
                    responsavel.getName(), comunicado.getTitulo());
            criar(TipoNotificacao.COMUNICADO, responsavel, null, REF_COMUNICADO, comunicadoId, chave, variaveis);
        }
    }

    @Transactional(readOnly = true)
    public List<AvisoDTO> avisosDoResponsavel(String email) {
        Responsible responsavel = responsibleRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Responsável não encontrado: " + email));
        return notificacaoRepository.buscarAvisosDoResponsavel(responsavel.getId(),
                        StatusNotificacao.CANCELADA, TipoNotificacao.COMUNICADO).stream()
                .filter(n -> n.getVariaveis() != null)
                .map(n -> {
                    List<String> variaveis = List.of(objectMapper.readValue(n.getVariaveis(), String[].class));
                    Student aluno = n.getStudent();
                    return new AvisoDTO(n.getId(), n.getTipo(), templateRegistry.titulo(n.getTemplate()),
                            templateRegistry.renderizarParaPortal(n.getTemplate(), variaveis),
                            aluno == null ? null : aluno.getId(),
                            aluno == null ? null : aluno.getFullName(),
                            n.getCriadoEm());
                })
                .toList();
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

    @Transactional
    public void apagarDadosDoAluno(Long studentId) {
        int apagadas = notificacaoRepository.apagarVariaveisDoAluno(studentId);
        log.info(AuditMarker.AUDIT, "Dados pessoais apagados das notificações | aluno {} | {}", studentId, apagadas);
    }

    @Transactional
    public void apagarDadosDoResponsavel(Long responsavelId) {
        int apagadas = notificacaoRepository.apagarVariaveisDoResponsavel(responsavelId);
        log.info(AuditMarker.AUDIT, "Dados pessoais apagados das notificações | responsável {} | {}", responsavelId, apagadas);
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

    private List<Responsible> responsaveisDaTurma(Long turmaId) {
        return studentRepository.findByTurmaId(turmaId, Sort.unsorted()).stream()
                .filter(s -> s.getStatusMatricula() == StatusMatricula.ATIVA)
                .map(Student::getResponsible)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    public String motivoBloqueio(Responsible responsavel, Student aluno) {
        if (responsavel == null) return "Aluno sem responsável cadastrado";
        if (!responsavel.isAtivo()) return "Responsável inativo ou anonimizado";
        if (responsavel.getTermsAcceptedAt() == null) return "Responsável ainda não aceitou os termos";
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

    // Verifica se aluno é elegível para receber notificação (acesso liberado pelo responsável)
    private boolean elegivelAluno(Student aluno) {
        if (aluno == null) return false;
        // Acesso só liberado se acessoLiberadoEm foi definido (aluno pode acessar portal)
        if (aluno.getAcessoLiberadoEm() == null) return false;
        if (aluno.getStatusMatricula() != StatusMatricula.ATIVA) return false;
        return true;
    }

    private void criar(TipoNotificacao tipo, Responsible responsavel, Student aluno, String referenciaTipo,
                       Long referenciaId, String chave, List<String> variaveis) {
        criar(tipo, null, responsavel, aluno, referenciaTipo, referenciaId, chave, variaveis);
    }

    private void criar(TipoNotificacao tipo, String templateNome, Responsible responsavel, Student aluno,
                       String referenciaTipo, Long referenciaId, String chave, List<String> variaveis) {
        if (notificacaoRepository.existsByChaveIdempotencia(chave)) {
            log.debug("Notificação ignorada, chave já existe: {}", chave);
            return;
        }
        String template = templateNome != null ? templateRegistry.porNome(templateNome).nome()
                : templateRegistry.template(tipo).nome();
        Notificacao notificacao = new Notificacao(tipo, responsavel, aluno, referenciaTipo, referenciaId,
                chave, template, objectMapper.writeValueAsString(variaveis));
        notificacao = notificacaoRepository.save(notificacao);
        // Log para responsável ou aluno
        String destino = responsavel != null
            ? EmailUtil.mascarar(responsavel.getEmail())
            : (aluno != null ? EmailUtil.mascarar(aluno.getEmail()) : "desconhecido");
        String destinatario = responsavel != null ? "responsável " + responsavel.getId() : "aluno " + aluno.getId();
        log.info(AuditMarker.AUDIT, "Notificação {} criada | {} | {} | {}",
                notificacao.getId(), tipo, destinatario, destino);
    }

    @Scheduled(cron = "${notificacao.retencao-cron:0 0 3 * * *}")
    @Transactional
    public int apagarVencidas() {
        LocalDateTime limite = LocalDateTime.now().minusMonths(MESES_RETENCAO);
        int apagadas = notificacaoRepository.apagarCriadasAntesDe(limite);
        if (apagadas == 0) return 0;
        log.info("Retenção: {} registros de aviso anteriores a {} apagados", apagadas, limite.toLocalDate());
        return apagadas;
    }
}
