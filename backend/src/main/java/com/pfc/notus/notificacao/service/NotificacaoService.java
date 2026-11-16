package com.pfc.notus.notificacao.service;

import lombok.RequiredArgsConstructor;
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
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;

// ! REFN: Cria os avisos (falta, nota final, atividade, comunicado) na fila, decide quem pode receber e cancela/apaga quando precisa
@Service
@RequiredArgsConstructor
public class NotificacaoService {

    // ! REFN: log, formato de data e locale pt-BR usados nos textos
    private static final Logger log = LoggerFactory.getLogger(NotificacaoService.class);
    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Locale PT_BR = Locale.of("pt", "BR");

    // ! REFN: tipos de referência (o que gerou o aviso) e meses que os registros ficam guardados
    public static final String REF_FALTA = "FALTA";
    public static final String REF_BOLETIM = "BOLETIM";
    public static final String REF_ATIVIDADE = "ATIVIDADE";
    public static final String REF_COMUNICADO = "COMUNICADO";
    public static final int MESES_RETENCAO = 6;

    // ! REFN: repositório da fila, registro de templates, JSON e repositórios das entidades que geram aviso
    private final NotificacaoRepository notificacaoRepository;

    private final TemplateRegistry templateRegistry;

    private final ObjectMapper objectMapper;

    private final FaltaRepository faltaRepository;

    private final BoletimRepository boletimRepository;

    private final AtividadeRepository atividadeRepository;

    private final StudentRepository studentRepository;

    private final ComunicadoRepository comunicadoRepository;

    private final ResponsibleRepository responsibleRepository;

    // ! REFN: cria aviso de falta para o responsável e para o aluno (se tiver acesso), com disciplina, data e total no ano
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notificarFalta(Long faltaId, int totalFaltasNaDisciplina) {
        FaltaDomain falta = faltaRepository.findById(faltaId).orElse(null);
        if (falta == null) {
            log.warn("Falta {} não encontrada ao criar a notificação", faltaId);
            return;
        }
        Student aluno = falta.getAluno();
        String chave = "FALTA:%d:%d:%s".formatted(aluno.getId(), falta.getDisciplina().getId(), falta.getData());
        Aviso aviso = new Aviso(TipoNotificacao.FALTA, null, REF_FALTA, falta.getId(),
                falta.getDisciplina().getTitle(), falta.getData().format(DATA_BR), String.valueOf(totalFaltasNaDisciplina));
        avisarResponsavel(aviso, aluno, chave);
        avisarAluno(aviso, aluno, chave);
    }

    // ! REFN: cria aviso de nota final lançada/atualizada para responsável e aluno
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notificarNotaFinal(Long boletimId, boolean atualizada) {
        Boletim boletim = boletimRepository.findById(boletimId).orElse(null);
        if (boletim == null) {
            log.warn("Nota final {} não encontrada ao criar a notificação", boletimId);
            return;
        }
        Student aluno = boletim.getStudent();
        String chave = "NOTA_FINAL:%d:%s".formatted(boletim.getId(), boletim.getLancadoEm());
        Aviso aviso = new Aviso(TipoNotificacao.NOTA_FINAL, atualizada ? "nota_atualizada" : null, REF_BOLETIM, boletim.getId(),
                boletim.getDisciplina().getTitle(), boletim.getBimestre().getDescricao(), String.format(PT_BR, "%.1f", boletim.getNotaFinal()));
        avisarResponsavel(aviso, aluno, chave);
        avisarAluno(aviso, aluno, chave);
    }

    // ! REFN: busca a atividade e os alunos da turma e cria os avisos
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

    /** Um aviso por responsável (mesmo com 2 filhos na turma) e um para cada aluno com acesso ao portal. */
    // ! REFN: um aviso por responsável (mesmo com 2 filhos na turma) e um para cada aluno com acesso ao portal
    @Transactional
    public void notificarAtividade(Long atividadeId, Collection<Student> alunosDaTurma,
                                   String disciplina, String titulo, LocalDate prazo) {
        Aviso aviso = new Aviso(TipoNotificacao.ATIVIDADE, null, REF_ATIVIDADE, atividadeId,
                disciplina, titulo, prazo == null ? "sem prazo" : prazo.format(DATA_BR));
        for (Student aluno : primeiroAlunoDeCadaResponsavel(alunosDaTurma)) {
            avisarResponsavel(aviso, aluno, "ATIVIDADE:%d:%d".formatted(atividadeId, aluno.getResponsible().getId()));
        }
        for (Student aluno : alunosDaTurma) {
            avisarAluno(aviso, aluno, "ATIVIDADE:%d:%d".formatted(atividadeId, aluno.getId()));
        }
    }

    // ! REFN: comunicado global vai para todos os responsáveis elegíveis; recado de turma só para os responsáveis daquela turma
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
            if (podeReceberComunicado(responsavel)) {
                List<String> variaveis = templateRegistry.variaveis(TipoNotificacao.COMUNICADO, responsavel.getName(), comunicado.getTitulo());
                criar(TipoNotificacao.COMUNICADO, null, responsavel, null, REF_COMUNICADO, comunicadoId,
                        "COMUNICADO:%d:%d".formatted(comunicadoId, responsavel.getId()), variaveis);
            }
        }
    }

    // ! REFN: avisos do responsável para o portal, com título e texto já montados pelo template (sem comunicados nem cancelados)
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

    // ! REFN: cancela avisos pendentes de uma falta/nota/atividade/comunicado que foi apagado
    @Transactional
    public void cancelarPorReferencia(String referenciaTipo, Long referenciaId, String motivo) {
        int canceladas = notificacaoRepository.cancelarPorReferencia(
                StatusNotificacao.PENDENTE, StatusNotificacao.CANCELADA, referenciaTipo, referenciaId, motivo);
        if (canceladas > 0) {
            log.info(AuditMarker.AUDIT, "Notificações canceladas | {}:{} | {} | {}", referenciaTipo, referenciaId, canceladas, motivo);
        }
    }

    // ! REFN: cancela tudo que está pendente para um responsável (ex: anonimizado)
    @Transactional
    public void cancelarPendentesDoResponsavel(Long responsavelId, String motivo) {
        int canceladas = notificacaoRepository.cancelarPorResponsavel(
                StatusNotificacao.PENDENTE, StatusNotificacao.CANCELADA, responsavelId, motivo);
        if (canceladas > 0) {
            log.info(AuditMarker.AUDIT, "Notificações canceladas | responsável {} | {} | {}", responsavelId, canceladas, motivo);
        }
    }

    // ! REFN: cancela tudo que está pendente para um aluno (ex: matrícula cancelada)
    @Transactional
    public void cancelarPendentesDoAluno(Long studentId, String motivo) {
        int canceladas = notificacaoRepository.cancelarPorAluno(
                StatusNotificacao.PENDENTE, StatusNotificacao.CANCELADA, studentId, motivo);
        if (canceladas > 0) {
            log.info(AuditMarker.AUDIT, "Notificações canceladas | aluno {} | {} | {}", studentId, canceladas, motivo);
        }
    }

    // ! REFN: LGPD: limpa as variáveis (nome etc.) dos avisos do aluno
    @Transactional
    public void apagarDadosDoAluno(Long studentId) {
        int apagadas = notificacaoRepository.apagarVariaveisDoAluno(studentId);
        log.info(AuditMarker.AUDIT, "Dados pessoais apagados das notificações | aluno {} | {}", studentId, apagadas);
    }

    // ! REFN: LGPD: limpa as variáveis dos avisos do responsável
    @Transactional
    public void apagarDadosDoResponsavel(Long responsavelId) {
        int apagadas = notificacaoRepository.apagarVariaveisDoResponsavel(responsavelId);
        log.info(AuditMarker.AUDIT, "Dados pessoais apagados das notificações | responsável {} | {}", responsavelId, apagadas);
    }

    // ! REFN: consulta da fila para o admin com filtros opcionais de tipo, status, responsável e datas
    @Transactional(readOnly = true)
    public List<NotificacaoDTO> listar(TipoNotificacao tipo, StatusNotificacao status, Long responsavelId,
                                       LocalDate de, LocalDate ate) {
        LocalDateTime inicio = de == null ? LocalDateTime.of(1970, 1, 1, 0, 0) : de.atStartOfDay();
        LocalDateTime fim = ate == null ? LocalDateTime.of(9999, 12, 31, 0, 0) : ate.plusDays(1).atStartOfDay();
        return notificacaoRepository.buscar(tipo, status, responsavelId, inicio, fim).stream()
                .map(NotificacaoDTO::from)
                .toList();
    }

    // ! REFN: só notificação com FALHA pode ser reenviada: zera tentativas e volta para PENDENTE
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

    // ! REFN: responsáveis dos alunos ativos de uma turma, sem repetir
    private List<Responsible> responsaveisDaTurma(Long turmaId) {
        return studentRepository.findByTurmaId(turmaId, Sort.unsorted()).stream()
                .filter(s -> s.getStatusMatricula() == StatusMatricula.ATIVA)
                .map(Student::getResponsible)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    // ! REFN: por que o responsável não pode receber: inexistente, inativo, sem aceitar termos ou aluno sem matrícula ativa; null = pode
    public String motivoBloqueio(Responsible responsavel, Student aluno) {
        if (responsavel == null) return "Aluno sem responsável cadastrado";
        if (!responsavel.isAtivo()) return "Responsável inativo ou anonimizado";
        if (responsavel.getTermsAcceptedAt() == null) return "Responsável ainda não aceitou os termos";
        if (aluno != null && aluno.getStatusMatricula() != StatusMatricula.ATIVA) return "Matrícula do aluno não está ativa";
        return null;
    }

    // ! REFN: responsável pode receber aviso? (usa motivoBloqueio)
    private boolean elegivel(Responsible responsavel, Student aluno) {
        String motivo = motivoBloqueio(responsavel, aluno);
        if (motivo != null) {
            log.debug("Notificação não criada para o aluno {}: {}", aluno == null ? null : aluno.getId(), motivo);
            return false;
        }
        return true;
    }

    // Verifica se aluno é elegível para receber notificação (acesso liberado pelo responsável)
    // ! REFN: aluno pode receber aviso? precisa ter acesso liberado e matrícula ativa
    private boolean elegivelAluno(Student aluno) {
        if (aluno == null) return false;
        // Acesso só liberado se acessoLiberadoEm foi definido (aluno pode acessar portal)
        if (aluno.getAcessoLiberadoEm() == null) return false;
        if (aluno.getStatusMatricula() != StatusMatricula.ATIVA) return false;
        return true;
    }

    /** Comunicado vai para o responsável que tem pelo menos um filho com matrícula ativa. */
    // ! REFN: comunicado vai para o responsável que tem pelo menos um filho com matrícula ativa
    private boolean podeReceberComunicado(Responsible responsavel) {
        boolean temFilhoAtivo = responsavel.getStudents().stream()
                .anyMatch(s -> s.getStatusMatricula() == StatusMatricula.ATIVA);
        return temFilhoAtivo && motivoBloqueio(responsavel, null) == null;
    }

    // ! REFN: evita aviso duplicado quando o responsável tem 2 filhos na mesma turma
    private Collection<Student> primeiroAlunoDeCadaResponsavel(Collection<Student> alunos) {
        Map<Long, Student> porResponsavel = new LinkedHashMap<>();
        for (Student aluno : alunos) {
            if (elegivel(aluno.getResponsible(), aluno)) {
                porResponsavel.putIfAbsent(aluno.getResponsible().getId(), aluno);
            }
        }
        return porResponsavel.values();
    }

    /**
     * O que vai no aviso, sem o destinatário. "detalhes" são os campos do texto que vêm depois
     * do nome de quem recebe e do nome do aluno (ex.: disciplina, data, total de faltas).
     */
    // ! REFN: o que vai no aviso sem o destinatário: tipo, template, referência e os detalhes do texto
    private record Aviso(TipoNotificacao tipo, String templateNome, String referenciaTipo, Long referenciaId,
                         String... detalhes) {
    }

    /** Avisa o responsável, se ele pode receber (ativo, aceitou os termos e o filho está matriculado). */
    // ! REFN: cria o aviso para o responsável do aluno, se ele for elegível
    private void avisarResponsavel(Aviso aviso, Student aluno, String chave) {
        Responsible responsavel = aluno.getResponsible();
        if (elegivel(responsavel, aluno)) {
            criar(aviso, responsavel, aluno, chave + ":RESPONSAVEL", responsavel.getName());
        }
    }

    /** Avisa o próprio aluno, se o acesso dele ao portal foi liberado. */
    // ! REFN: cria o aviso para o próprio aluno, se o acesso dele estiver liberado
    private void avisarAluno(Aviso aviso, Student aluno, String chave) {
        if (elegivelAluno(aluno)) {
            criar(aviso, null, aluno, chave + ":ALUNO", aluno.getFullName());
        }
    }

    // ! REFN: monta as variáveis do template (nome de quem recebe, nome do aluno, detalhes) e grava
    private void criar(Aviso aviso, Responsible responsavel, Student aluno, String chave, String nomeDeQuemRecebe) {
        String[] valores = Stream.concat(Stream.of(nomeDeQuemRecebe, aluno.getFullName()), Arrays.stream(aviso.detalhes()))
                .toArray(String[]::new);
        criar(aviso.tipo(), aviso.templateNome(), responsavel, aluno, aviso.referenciaTipo(), aviso.referenciaId(),
                chave, templateRegistry.variaveis(aviso.tipo(), valores));
    }

    /** Grava o aviso na fila (o worker envia depois). A chave impede o mesmo aviso duas vezes. */
    // ! REFN: grava o aviso na fila com status PENDENTE; a chave de idempotência impede duplicar
    private void criar(TipoNotificacao tipo, String templateNome, Responsible responsavel, Student aluno,
                       String referenciaTipo, Long referenciaId, String chave, List<String> variaveis) {
        if (notificacaoRepository.existsByChaveIdempotencia(chave)) {
            log.debug("Notificação ignorada, chave já existe: {}", chave);
            return;
        }
        String template = templateNome != null ? templateRegistry.porNome(templateNome).nome()
                : templateRegistry.template(tipo).nome();
        Notificacao notificacao = notificacaoRepository.save(new Notificacao(tipo, responsavel, aluno, referenciaTipo,
                referenciaId, chave, template, objectMapper.writeValueAsString(variaveis)));
        String destinatario = responsavel != null ? "responsável " + responsavel.getId() : "aluno " + aluno.getId();
        String email = EmailUtil.mascarar(responsavel != null ? responsavel.getEmail() : aluno.getEmail());
        log.info(AuditMarker.AUDIT, "Notificação {} criada | {} | {} | {}", notificacao.getId(), tipo, destinatario, email);
    }

    // ! REFN: job diário (3h): apaga avisos com mais de 6 meses
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
