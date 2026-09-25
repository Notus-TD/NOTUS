package com.pfc.notus.notificacao.whatsapp;

import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.notificacao.config.WhatsAppProperties;
import com.pfc.notus.notificacao.domain.Notificacao;
import com.pfc.notus.notificacao.domain.StatusNotificacao;
import com.pfc.notus.notificacao.repository.NotificacaoRepository;
import com.pfc.notus.user.service.ResponsibleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

@Service
public class WhatsAppWebhookService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookService.class);
    private static final String PREFIXO_ASSINATURA = "sha256=";
    private static final String PALAVRA_OPT_OUT = "SAIR";

    @Autowired
    private WhatsAppProperties properties;

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @Autowired
    private ResponsibleService responsibleService;

    public boolean verificarToken(String mode, String verifyToken) {
        String esperado = properties.verifyToken();
        return "subscribe".equals(mode)
                && esperado != null && !esperado.isBlank()
                && MessageDigest.isEqual(esperado.getBytes(StandardCharsets.UTF_8),
                verifyToken == null ? new byte[0] : verifyToken.getBytes(StandardCharsets.UTF_8));
    }

    public boolean assinaturaValida(byte[] corpo, String assinatura) {
        String appSecret = properties.appSecret();
        if (appSecret == null || appSecret.isBlank()) {
            log.warn("Webhook do WhatsApp recebido, mas WHATSAPP_APP_SECRET não está configurado. Requisição rejeitada.");
            return false;
        }
        if (assinatura == null || !assinatura.startsWith(PREFIXO_ASSINATURA)) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(appSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] esperado = mac.doFinal(corpo);
            byte[] recebido = HexFormat.of().parseHex(assinatura.substring(PREFIXO_ASSINATURA.length()));
            return MessageDigest.isEqual(esperado, recebido);
        } catch (IllegalArgumentException | GeneralSecurityException e) {
            return false;
        }
    }

    @Transactional
    public void processar(WebhookPayload payload) {
        if (payload.entry() == null) return;
        for (WebhookPayload.Entry entry : payload.entry()) {
            if (entry.changes() == null) continue;
            for (WebhookPayload.Change change : entry.changes()) {
                WebhookPayload.Value value = change.value();
                if (value == null) continue;
                if (value.statuses() != null) value.statuses().forEach(this::atualizarStatus);
                if (value.messages() != null) value.messages().forEach(this::tratarMensagem);
            }
        }
    }

    private void atualizarStatus(WebhookPayload.StatusEvento evento) {
        if (evento.id() == null || evento.status() == null) return;
        Notificacao notificacao = notificacaoRepository.findByProviderMessageId(evento.id()).orElse(null);
        if (notificacao == null) {
            log.debug("Status de mensagem desconhecida no webhook: {}", evento.id());
            return;
        }

        StatusNotificacao atual = notificacao.getStatus();
        switch (evento.status().toLowerCase(Locale.ROOT)) {
            case "sent" -> {
                if (atual == StatusNotificacao.ENVIANDO) notificacao.setStatus(StatusNotificacao.ENVIADA);
            }
            case "delivered" -> {
                if (atual == StatusNotificacao.ENVIANDO || atual == StatusNotificacao.ENVIADA) {
                    notificacao.setStatus(StatusNotificacao.ENTREGUE);
                }
            }
            case "read" -> {
                if (atual == StatusNotificacao.ENVIANDO || atual == StatusNotificacao.ENVIADA
                        || atual == StatusNotificacao.ENTREGUE) {
                    notificacao.setStatus(StatusNotificacao.LIDA);
                }
            }
            case "failed" -> {
                if (atual != StatusNotificacao.LIDA) {
                    notificacao.setStatus(StatusNotificacao.FALHA);
                    notificacao.setErro(descreverErro(evento.errors()));
                    log.warn(AuditMarker.AUDIT, "Notificação {} falhou (webhook) | {}", notificacao.getId(), notificacao.getErro());
                }
            }
            default -> log.debug("Status de webhook ignorado: {}", evento.status());
        }
    }

    private void tratarMensagem(WebhookPayload.MensagemRecebida mensagem) {
        if (!"text".equals(mensagem.type()) || mensagem.text() == null || mensagem.from() == null) return;
        String texto = mensagem.text().body() == null ? "" : mensagem.text().body().trim();
        if (PALAVRA_OPT_OUT.equalsIgnoreCase(texto)) {
            responsibleService.optOutPorTelefone("+" + mensagem.from());
        }
    }

    private static String descreverErro(List<WebhookPayload.ErroEvento> erros) {
        if (erros == null || erros.isEmpty()) return "Falha informada pela Meta";
        WebhookPayload.ErroEvento erro = erros.getFirst();
        String descricao = "código " + erro.code() + " / " + (erro.title() != null ? erro.title() : erro.message());
        return descricao.length() > 500 ? descricao.substring(0, 500) : descricao;
    }
}
