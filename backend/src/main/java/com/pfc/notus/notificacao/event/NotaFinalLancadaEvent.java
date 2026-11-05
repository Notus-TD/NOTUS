package com.pfc.notus.notificacao.event;

/** Nota final salva. {@code atualizada} indica que já havia uma nota e o valor mudou. */
public record NotaFinalLancadaEvent(Long boletimId, boolean atualizada) {
}
