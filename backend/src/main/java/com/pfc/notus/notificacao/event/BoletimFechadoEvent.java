package com.pfc.notus.notificacao.event;

/**
 * Publicado pelo BoletimService ao fechar o boletim. Só é entregue ao
 * NotificacaoListener depois do commit. Carrega ids, não entidades.
 */
public record BoletimFechadoEvent(Long boletimId) {
}
