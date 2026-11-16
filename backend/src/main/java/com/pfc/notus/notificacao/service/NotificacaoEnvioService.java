package com.pfc.notus.notificacao.service;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.notificacao.config.NotificacaoProperties;
import com.pfc.notus.notificacao.domain.Notificacao;
import com.pfc.notus.notificacao.domain.StatusNotificacao;
import com.pfc.notus.notificacao.port.ResultadoEnvio;
import com.pfc.notus.notificacao.repository.NotificacaoRepository;
import com.pfc.notus.notificacao.util.EmailUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificacaoEnvioService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoEnvioService.class);

    private static final Duration RESERVA = Duration.ofMinutes(10);

    private static final int MAX_ERRO = 500;

    public record EnvioPreparado(Long id, String email, String template, List<String> variaveis) {
    }

    private final NotificacaoRepository notificacaoRepository;

    private final NotificacaoService notificacaoService;

    private final NotificacaoProperties properties;

    private final ObjectMapper objectMapper;

    @Transactional
    public List<Long> reservarLote(LocalDateTime inicioCiclo) {
        List<Long> ids = notificacaoRepository.findIdsProntosParaEnvio(
                StatusNotificacao.PENDENTE, StatusNotificacao.ENVIANDO, inicioCiclo, PageRequest.of(0, properties.lote()));
        LocalDateTime reservadaAte = LocalDateTime.now().plus(RESERVA);
        for (Notificacao notificacao : notificacaoRepository.findAllById(ids)) {
            notificacao.setStatus(StatusNotificacao.ENVIANDO);
            notificacao.setProximaTentativaEm(reservadaAte);
        }
        return ids;
    }

    @Transactional
    public Optional<EnvioPreparado> preparar(Long id) {
        Notificacao notificacao = notificacaoRepository.findById(id).orElse(null);
        if (notificacao == null || notificacao.getStatus() != StatusNotificacao.ENVIANDO) {
            return Optional.empty();
        }

        String motivo = notificacaoService.motivoBloqueio(notificacao.getResponsavel(), notificacao.getStudent());
        if (motivo != null) {
            notificacao.setStatus(StatusNotificacao.CANCELADA);
            notificacao.setErro(motivo);
            log.info(AuditMarker.AUDIT, "Notificação {} cancelada no envio | {}", id, motivo);
            return Optional.empty();
        }

        List<String> variaveis = Arrays.asList(objectMapper.readValue(notificacao.getVariaveis(), String[].class));
        return Optional.of(new EnvioPreparado(id, emailDestino(notificacao), notificacao.getTemplate(), variaveis));
    }

    @Transactional
    public void registrarResultado(Long id, ResultadoEnvio resultado) {
        Notificacao notificacao = notificacaoRepository.findById(id).orElse(null);
        if (notificacao == null || notificacao.getStatus() != StatusNotificacao.ENVIANDO) {
            return;
        }
        notificacao.setTentativas(notificacao.getTentativas() + 1);
        String destino = EmailUtil.mascarar(emailDestino(notificacao));

        switch (resultado.tipo()) {
            case SUCESSO -> marcarEnviada(notificacao, resultado.providerMessageId(), destino);
            case DEFINITIVO -> falhar(notificacao, resultado.erro(), destino);
            case TEMPORARIO -> tentarDeNovoOuFalhar(notificacao, resultado.erro(), destino);
        }
    }

    private void marcarEnviada(Notificacao notificacao, String providerMessageId, String destino) {
        notificacao.setStatus(StatusNotificacao.ENVIADA);
        notificacao.setProviderMessageId(providerMessageId);
        notificacao.setEnviadoEm(LocalDateTime.now());
        notificacao.setErro(null);
        log.info(AuditMarker.AUDIT, "Notificação {} enviada | {} | {} | {}",
                notificacao.getId(), notificacao.getTipo(), destino, providerMessageId);
    }

    /** Erro temporário (ex.: provedor fora do ar): volta para a fila até esgotar as tentativas. */
    private void tentarDeNovoOuFalhar(Notificacao notificacao, String erro, String destino) {
        if (notificacao.getTentativas() >= properties.maxTentativas()) {
            falhar(notificacao, "Tentativas esgotadas: " + erro, destino);
            return;
        }
        notificacao.setStatus(StatusNotificacao.PENDENTE);
        notificacao.setProximaTentativaEm(LocalDateTime.now());
        notificacao.setErro(truncar(erro));
        log.warn("Notificação {} com erro temporário (tentativa {} de {}), nova tentativa no próximo ciclo: {}",
                notificacao.getId(), notificacao.getTentativas(), properties.maxTentativas(), erro);
    }

    /** Aviso de responsável vai para o e-mail dele; aviso de aluno, para o do aluno. */
    private static String emailDestino(Notificacao notificacao) {
        return notificacao.getResponsavel() != null
                ? notificacao.getResponsavel().getEmail()
                : notificacao.getStudent().getEmail();
    }

    private void falhar(Notificacao notificacao, String erro, String destino) {
        notificacao.setStatus(StatusNotificacao.FALHA);
        notificacao.setErro(truncar(erro));
        log.warn(AuditMarker.AUDIT, "Notificação {} falhou | {} | {} | {}",
                notificacao.getId(), notificacao.getTipo(), destino, erro);
    }

    private static String truncar(String erro) {
        if (erro == null) return null;
        return erro.length() > MAX_ERRO ? erro.substring(0, MAX_ERRO) : erro;
    }
}
