package com.pfc.notus.user.dto;


import com.pfc.notus.user.domain.enums.StatusMatricula;

public record StudentMinDTO(Long userId, Long matricula, String studentName, StatusMatricula matriculaStatus) {
}
