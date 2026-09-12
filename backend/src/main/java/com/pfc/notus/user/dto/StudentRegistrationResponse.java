package com.pfc.notus.user.dto;

import com.pfc.notus.matricula.domain.StatusMatricula;

public record StudentRegistrationResponse(Long userId, StatusMatricula matriculaStatus) {
}
