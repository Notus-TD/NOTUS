package com.pfc.notus.comunicado.dto;

import com.pfc.notus.comunicado.domain.PublicoComunicado;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ComunicadoRequest(
        @NotBlank @Size(max = 150) String titulo,
        @NotBlank @Size(max = 4000) String texto,
        @NotNull PublicoComunicado publico
) {
}
