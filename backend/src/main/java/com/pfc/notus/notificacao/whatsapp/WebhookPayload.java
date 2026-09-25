package com.pfc.notus.notificacao.whatsapp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record WebhookPayload(List<Entry> entry) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Entry(List<Change> changes) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Change(Value value) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Value(List<StatusEvento> statuses, List<MensagemRecebida> messages) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record StatusEvento(String id, String status, String timestamp,
                               @JsonProperty("recipient_id") String recipientId,
                               List<ErroEvento> errors) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ErroEvento(Integer code, String title, String message) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MensagemRecebida(String from, String id, String type, Texto text) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Texto(String body) {
    }
}
