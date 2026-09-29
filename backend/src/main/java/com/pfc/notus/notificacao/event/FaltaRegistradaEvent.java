package com.pfc.notus.notificacao.event;

/**
 * Publicado pelo FaltaService dentro da transação da falta. Só é entregue ao
 * NotificacaoListener depois do commit. Carrega ids, não entidades.
 */
public record FaltaRegistradaEvent(Long faltaId, int totalFaltasNaDisciplina) {
}
