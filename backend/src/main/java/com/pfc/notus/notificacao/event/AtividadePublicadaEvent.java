package com.pfc.notus.notificacao.event;

/**
 * Publicado pelo AtividadeService dentro da transação da atividade. Só é entregue ao
 * NotificacaoListener depois do commit. Carrega ids, não entidades.
 */
public record AtividadePublicadaEvent(Long atividadeId) {
}
