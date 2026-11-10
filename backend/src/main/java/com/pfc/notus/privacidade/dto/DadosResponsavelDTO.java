package com.pfc.notus.privacidade.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DadosResponsavelDTO(
        Long id,
        String nome,
        String email,
        String telefone,
        LocalDate cadastradoEm,
        LocalDateTime termosAceitosEm
) {
}
