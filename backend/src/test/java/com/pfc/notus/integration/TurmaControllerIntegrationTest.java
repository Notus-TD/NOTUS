package com.pfc.notus.integration;

import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.dto.TurmaDTO;
import com.pfc.notus.turma.dto.TurmaRequestDTO;
import com.pfc.notus.turma.repository.TurmaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TurmaControllerIntegrationTest extends IntegrationTestBase {

    private static final String BASE_PATH = "/turma";
    private static final String ANO_LETIVO = "2026";

    @Autowired
    private TurmaRepository turmaRepository;

    private String tokenAdmin;

    @BeforeEach
    void logarAdmin() {
        tokenAdmin = criarAdminELogar();
    }

    @Test
    void criar_comDadosValidos_deveRetornar200ComNomeSemEspacosEGravarNoBanco() {
        String nome = "7A " + System.nanoTime();

        ResponseEntity<TurmaDTO> response = client.post().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TurmaRequestDTO("  " + nome + "  ", ANO_LETIVO))
                .retrieve()
                .toEntity(TurmaDTO.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        TurmaDTO body = response.getBody();
        assertThat(body.id()).isNotNull();
        assertThat(body.name()).isEqualTo(nome);
        assertThat(body.schoolYear()).isEqualTo(ANO_LETIVO);
        assertThat(body.totalAlunos()).isZero();

        Turma gravada = turmaRepository.findById(body.id()).orElseThrow();
        assertThat(gravada.getName()).isEqualTo(nome);
        assertThat(gravada.getSchoolYear()).isEqualTo(ANO_LETIVO);
    }

    @Test
    void criar_comNomeEAnoJaExistentes_deveRetornar409ComMensagem() {
        String nome = "8B " + System.nanoTime();
        criarTurma(nome);

        ResponseEntity<ErroPadrao> response = client.post().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TurmaRequestDTO(nome, ANO_LETIVO))
                .retrieve()
                .toEntity(ErroPadrao.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().status()).isEqualTo(409);
        assertThat(response.getBody().message()).contains(nome);
    }

    @Test
    void criar_comNomeEmBranco_deveRetornar422ComCampoInvalidoESemGravar() {
        long quantidadeAntes = turmaRepository.count();

        ResponseEntity<ErroValidacao> response = client.post().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TurmaRequestDTO(" ", ANO_LETIVO))
                .retrieve()
                .toEntity(ErroValidacao.class);

        assertThat(response.getStatusCode().value()).isEqualTo(422);
        assertThat(response.getBody().message()).isEqualTo("Invalid data");
        assertThat(response.getBody().errors()).extracting(CampoInvalido::fieldName).containsExactly("name");
        assertThat(turmaRepository.count()).isEqualTo(quantidadeAntes);
    }

    private record ErroPadrao(Integer status, String message, String path) {
    }

    private record ErroValidacao(Integer status, String message, String path, List<CampoInvalido> errors) {
    }

    private record CampoInvalido(String fieldName, String message) {
    }

    private TurmaDTO criarTurma(String nome) {
        return client.post().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TurmaRequestDTO(nome, ANO_LETIVO))
                .retrieve()
                .body(TurmaDTO.class);
    }
}
