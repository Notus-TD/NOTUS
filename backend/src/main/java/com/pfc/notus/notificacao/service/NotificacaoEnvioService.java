package com.pfc.notus.notificacao.service;

import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.notificacao.config.NotificacaoProperties;
import com.pfc.notus.notificacao.domain.Notificacao;
import com.pfc.notus.notificacao.domain.StatusNotificacao;
import com.pfc.notus.notificacao.port.ResultadoEnvio;
import com.pfc.notus.notificacao.repository.NotificacaoRepository;
import com.pfc.notus.notificacao.util.TelefoneUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
public class NotificacaoEnvioService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoEnvioService.class);

    private static final Duration[] ESPERAS = {Duration.ofMinutes(1), Duration.ofMinutes(5), Duration.ofMinutes(15)};

    private static final Duration RESERVA = Duration.ofMinutes(10);

    private static final int MAX_ERRO = 500;

    public record EnvioPreparado(Long id, String telefone, String template, List<String> variaveis) {
    }

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private NotificacaoProperties properties;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public List<Long> reservarLote() {
        LocalDateTime agora = LocalDateTime.now();
        List<Long> ids = notificacaoRepository.findIdsProntosParaEnvio(
                StatusNotificacao.PENDENTE, StatusNotificacao.ENVIANDO, agora, PageRequest.of(0, properties.lote()));
        for (Notificacao notificacao : notificacaoRepository.findAllById(ids)) {
            notificacao.setStatus(StatusNotificacao.ENVIANDO);
            notificacao.setProximaTentativaEm(agora.plus(RESERVA));
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
        return Optional.of(new EnvioPreparado(id, notificacao.getResponsavel().getPhone(), notificacao.getTemplate(), variaveis));
    }

    @Transactional
    public void registrarResultado(Long id, ResultadoEnvio resultado) {
        Notificacao notificacao = notificacaoRepository.findById(id).orElse(null);
        if (notificacao == null || notificacao.getStatus() != StatusNotificacao.ENVIANDO) {
            return;
        }
        notificacao.setTentativas(notificacao.getTentativas() + 1);
        String destino = TelefoneUtil.mascarar(notificacao.getResponsavel().getPhone());

        switch (resultado.tipo()) {
            case SUCESSO -> {
                notificacao.setStatus(StatusNotificacao.ENVIADA);
                notificacao.setProviderMessageId(resultado.providerMessageId());
                notificacao.setEnviadoEm(LocalDateTime.now());
                notificacao.setErro(null);
                log.info(AuditMarker.AUDIT, "Notificação {} enviada | {} | {} | {}",
                        id, notificacao.getTipo(), destino, resultado.providerMessageId());
            }
            case DEFINITIVO -> falhar(notificacao, resultado.erro(), destino);
            case TEMPORARIO -> {
                if (notificacao.getTentativas() >= properties.maxTentativas()) {
                    falhar(notificacao, "Tentativas esgotadas: " + resultado.erro(), destino);
                } else {
                    Duration espera = ESPERAS[Math.min(notificacao.getTentativas() - 1, ESPERAS.length - 1)];
                    notificacao.setStatus(StatusNotificacao.PENDENTE);
                    notificacao.setProximaTentativaEm(LocalDateTime.now().plus(espera));
                    notificacao.setErro(truncar(resultado.erro()));
                    log.warn("Notificação {} com erro temporário (tentativa {}), nova tentativa em {} min: {}",
                            id, notificacao.getTentativas(), espera.toMinutes(), resultado.erro());
                }
            }
        }
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
