package com.pfc.notus.comunicado.dto;

import com.pfc.notus.comunicado.domain.Comunicado;
import com.pfc.notus.comunicado.domain.PublicoComunicado;

import java.time.LocalDateTime;

// ! REFC: DTO de saída: expõe apenas dados públicos (omite tipoRemetente, turmaId, anoLetivo)
public record ComunicadoDTO(Long id, String titulo, String texto, PublicoComunicado publico,
                            LocalDateTime enviadoEm, String autorEmail) {

    // ! REFC: Mapper que converte entidade Comunicado em DTO para resposta HTTP
    public static ComunicadoDTO from(Comunicado c) {
        return new ComunicadoDTO(c.getId(), c.getTitulo(), c.getTexto(), c.getPublico(), c.getEnviadoEm(), c.getAutorEmail());
    }
}
