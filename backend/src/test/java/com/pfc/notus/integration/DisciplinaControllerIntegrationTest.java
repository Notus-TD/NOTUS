package com.pfc.notus.integration;

import com.pfc.notus.disciplina.dto.DisciplinaDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DisciplinaControllerIntegrationTest extends IntegrationTestBase {

    private static final String BASE_PATH = "/disciplina";
    private static final LocalDateTime DATA_CRIACAO = LocalDateTime.of(2026, 3, 2, 8, 0);

    private String tokenAdmin;

    @BeforeEach
    void logarAdmin() {
        tokenAdmin = criarAdminELogar();
    }

    @Test
    void listar_comDisciplinaCriada_deveRetornar200ComADisciplinaNaLista() {
        String titulo = "Matematica " + System.nanoTime();
        DisciplinaDTO criada = criarDisciplina(titulo);

        ResponseEntity<List<DisciplinaDTO>> response = client.get().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toEntity(new ParameterizedTypeReference<>() {});

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains(criada);
        assertThat(criada.title()).isEqualTo(titulo);
    }

    private DisciplinaDTO buildDisciplinaRequest(String titulo) {
        return new DisciplinaDTO(null, titulo, "Descricao de " + titulo, DATA_CRIACAO);
    }

    private DisciplinaDTO criarDisciplina(String titulo) {
        return client.post().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(buildDisciplinaRequest(titulo))
                .retrieve()
                .body(DisciplinaDTO.class);
    }
}
