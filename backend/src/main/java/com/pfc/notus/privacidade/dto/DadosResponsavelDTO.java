package com.pfc.notus.privacidade.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

// ! REFP: Dados cadastrais do responsável na exportação
public record DadosResponsavelDTO(
        Long id,
        String nome,
        String email,
        String telefone,
        LocalDate cadastradoEm,
        LocalDateTime termosAceitosEm
) {
}
