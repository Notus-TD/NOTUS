package com.pfc.notus.user.dto;

import java.util.List;

public record MeuPerfilDTO(String email, List<String> roles, String nome, List<DependenteDTO> dependentes) {
}
