package com.pfc.notus.comunicado.dto;

import com.pfc.notus.comunicado.domain.Comunicado;
import com.pfc.notus.comunicado.domain.PublicoComunicado;

import java.time.LocalDateTime;

public record ComunicadoDTO(Long id, String titulo, String texto, PublicoComunicado publico,
                            LocalDateTime enviadoEm, String autorEmail) {

    public static ComunicadoDTO from(Comunicado c) {
        return new ComunicadoDTO(c.getId(), c.getTitulo(), c.getTexto(), c.getPublico(), c.getEnviadoEm(), c.getAutorEmail());
    }
}
