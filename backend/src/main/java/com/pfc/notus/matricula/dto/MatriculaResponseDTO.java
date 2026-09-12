package com.pfc.notus.matricula.dto;

import com.pfc.notus.matricula.domain.StatusMatricula;

public record MatriculaResponseDTO(StatusMatricula status, Long studentId) {
}
