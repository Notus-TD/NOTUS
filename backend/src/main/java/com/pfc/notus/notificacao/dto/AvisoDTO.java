package com.pfc.notus.notificacao.dto;

import com.pfc.notus.notificacao.domain.TipoNotificacao;

import java.time.LocalDateTime;

public record AvisoDTO(Long id, TipoNotificacao tipo, String titulo, String texto, Long studentId,
                       String alunoNome, LocalDateTime criadoEm) {
}
