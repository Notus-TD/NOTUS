package com.pfc.notus.notificacao.dto;

import com.pfc.notus.notificacao.domain.TipoNotificacao;

import java.time.LocalDateTime;

/** Aviso mostrado ao responsável no portal: o mesmo conteúdo do e-mail, sem dados de envio. */
public record AvisoDTO(Long id, TipoNotificacao tipo, String titulo, String texto, Long studentId,
                       String alunoNome, LocalDateTime criadoEm) {
}
