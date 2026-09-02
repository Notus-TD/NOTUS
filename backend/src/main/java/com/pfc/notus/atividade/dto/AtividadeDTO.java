package com.pfc.notus.atividade.dto;

import jakarta.validation.constraints.NotBlank;

public record AtividadeDTO(Long id, @NotBlank String title, @NotBlank  String content, @NotBlank String status) {
}
