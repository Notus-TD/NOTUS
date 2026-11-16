package com.pfc.notus.user.dto;

import java.util.List;

// ! REFU: Resposta do GET /auth/me: e-mail, papéis, nome e dependentes (se responsável)
public record MeuPerfilDTO(String email, List<String> roles, String nome, List<DependenteDTO> dependentes) {
}
