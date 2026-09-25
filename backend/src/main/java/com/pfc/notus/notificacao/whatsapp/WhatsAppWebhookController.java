package com.pfc.notus.notificacao.whatsapp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping(value = "/webhooks/whatsapp")
public class WhatsAppWebhookController {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookController.class);

    @Autowired
    private WhatsAppWebhookService webhookService;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping(produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> verificar(
            @RequestParam(name = "hub.mode", required = false) String mode,
            @RequestParam(name = "hub.verify_token", required = false) String verifyToken,
            @RequestParam(name = "hub.challenge", required = false) String challenge) {
        if (webhookService.verificarToken(mode, verifyToken) && challenge != null) {
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @PostMapping
    public ResponseEntity<Void> receber(
            @RequestBody byte[] corpo,
            @RequestHeader(name = "X-Hub-Signature-256", required = false) String assinatura) {
        if (!webhookService.assinaturaValida(corpo, assinatura)) {
            log.warn("Webhook do WhatsApp com assinatura inválida descartado");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            webhookService.processar(objectMapper.readValue(corpo, WebhookPayload.class));
        } catch (JacksonException e) {
            log.warn("Webhook do WhatsApp com corpo inválido: {}", e.getOriginalMessage());
        }
        return ResponseEntity.ok().build();
    }
}
