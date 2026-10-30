package com.pfc.notus.integration;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.dto.AulaRequestDTO;
import com.pfc.notus.disciplina.dto.DisciplinaDTO;
import com.pfc.notus.disciplina.repository.AulaRegistroRepository;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DisciplinaControllerIntegrationTest extends IntegrationTestBase {

    private static final String BASE_PATH = "/disciplina";
    private static final LocalDateTime DATA_CRIACAO = LocalDateTime.of(2026, 3, 2, 8, 0);
    private static final LocalDate DATA_AULA = LocalDate.of(2026, 3, 9);

    @Autowired
    private DisiciplinaRepository disciplinaRepository;

    @Autowired
    private AulaRegistroRepository aulaRegistroRepository;

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

    @Test
    void criar_comDadosValidos_deveRetornar200ComIdContentTypeJsonEGravarNoBanco() {
        String titulo = "Historia " + System.nanoTime();

        ResponseEntity<DisciplinaDTO> response = client.post().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(buildDisciplinaRequest(titulo))
                .retrieve()
                .toEntity(DisciplinaDTO.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_JSON);
        DisciplinaDTO body = response.getBody();
        assertThat(body.id()).isNotNull();
        assertThat(body.title()).isEqualTo(titulo);
        assertThat(body.description()).isEqualTo("Descricao de " + titulo);
        assertThat(body.dueDate()).isEqualTo(DATA_CRIACAO);

        Disciplina gravada = disciplinaRepository.findById(body.id()).orElseThrow();
        assertThat(gravada.getTitle()).isEqualTo(titulo);
        assertThat(gravada.getDescription()).isEqualTo("Descricao de " + titulo);
    }

    @Test
    void criar_comTituloEmBranco_deveRetornar422ComCampoInvalidoESemGravar() {
        long quantidadeAntes = disciplinaRepository.count();

        ResponseEntity<ErroValidacao> response = client.post().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(buildDisciplinaRequest(" "))
                .retrieve()
                .toEntity(ErroValidacao.class);

        assertThat(response.getStatusCode().value()).isEqualTo(422);
        ErroValidacao body = response.getBody();
        assertThat(body.status()).isEqualTo(422);
        assertThat(body.message()).isEqualTo("Invalid data");
        assertThat(body.path()).isEqualTo(BASE_PATH);
        assertThat(body.errors()).extracting(CampoInvalido::fieldName).containsExactly("title");
        assertThat(disciplinaRepository.count()).isEqualTo(quantidadeAntes);
    }

    @Test
    void remover_comIdExistente_deveRetornar204ESumirDoBancoEDaLista() {
        DisciplinaDTO criada = criarDisciplina("Geografia " + System.nanoTime());

        ResponseEntity<Void> response = client.delete().uri(BASE_PATH + "/" + criada.id())
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(disciplinaRepository.findById(criada.id())).isEmpty();
        List<DisciplinaDTO> lista = client.get().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
        assertThat(lista).doesNotContain(criada);
    }

    @Test
    void remover_comIdInexistente_deveRetornar404ComMensagem() {
        long idInexistente = System.nanoTime();

        ResponseEntity<ErroPadrao> response = client.delete().uri(BASE_PATH + "/" + idInexistente)
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toEntity(ErroPadrao.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        ErroPadrao body = response.getBody();
        assertThat(body.status()).isEqualTo(404);
        assertThat(body.message()).contains(String.valueOf(idInexistente));
        assertThat(body.path()).isEqualTo(BASE_PATH + "/" + idInexistente);
    }

    @Test
    void registrarAula_comDisciplinaExistente_deveRetornar204EGravarAAula() {
        DisciplinaDTO disciplina = criarDisciplina("Ciencias " + System.nanoTime());

        ResponseEntity<Void> response = registrarAula(disciplina.id(), DATA_AULA);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(aulaRegistroRepository.existsByDisciplinaIdAndData(disciplina.id(), DATA_AULA)).isTrue();
        assertThat(aulaRegistroRepository.countByDisciplinaId(disciplina.id())).isEqualTo(1);
    }

    @Test
    void registrarAula_comMesmaDataDuasVezes_deveRetornar204EManterUmRegistro() {
        DisciplinaDTO disciplina = criarDisciplina("Artes " + System.nanoTime());
        registrarAula(disciplina.id(), DATA_AULA);

        ResponseEntity<Void> response = registrarAula(disciplina.id(), DATA_AULA);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(aulaRegistroRepository.countByDisciplinaId(disciplina.id())).isEqualTo(1);
    }

    @Test
    void registrarAula_comDisciplinaInexistente_deveRetornar404ComMensagem() {
        long idInexistente = System.nanoTime();

        ResponseEntity<ErroPadrao> response = client.post().uri(BASE_PATH + "/" + idInexistente + "/aulas")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new AulaRequestDTO(DATA_AULA))
                .retrieve()
                .toEntity(ErroPadrao.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().status()).isEqualTo(404);
        assertThat(response.getBody().message()).contains(String.valueOf(idInexistente));
    }

    @Test
    void registrarAula_semData_deveRetornar422ComCampoInvalidoESemGravar() {
        DisciplinaDTO disciplina = criarDisciplina("Ingles " + System.nanoTime());

        ResponseEntity<ErroValidacao> response = client.post().uri(BASE_PATH + "/" + disciplina.id() + "/aulas")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new AulaRequestDTO(null))
                .retrieve()
                .toEntity(ErroValidacao.class);

        assertThat(response.getStatusCode().value()).isEqualTo(422);
        assertThat(response.getBody().errors()).extracting(CampoInvalido::fieldName).containsExactly("data");
        assertThat(aulaRegistroRepository.countByDisciplinaId(disciplina.id())).isZero();
    }

    @Test
    void criar_semToken_deveRetornar401ESemGravar() {
        String titulo = "Sem token " + System.nanoTime();

        ResponseEntity<Void> response = client.post().uri(BASE_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .body(buildDisciplinaRequest(titulo))
                .retrieve()
                .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(disciplinaRepository.findAll()).extracting(Disciplina::getTitle).doesNotContain(titulo);
    }

    @Test
    void criar_comoProfessor_deveRetornar403ESemGravar() {
        String titulo = "Sem permissao " + System.nanoTime();
        String tokenProfessor = criarProfessorELogar();

        ResponseEntity<Void> response = client.post().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenProfessor)
                .contentType(MediaType.APPLICATION_JSON)
                .body(buildDisciplinaRequest(titulo))
                .retrieve()
                .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(disciplinaRepository.findAll()).extracting(Disciplina::getTitle).doesNotContain(titulo);
    }

    @Test
    void criar_comoAdmin_deveRetornar200ComADisciplinaCriada() {
        String titulo = "Com permissao " + System.nanoTime();

        ResponseEntity<DisciplinaDTO> response = client.post().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(buildDisciplinaRequest(titulo))
                .retrieve()
                .toEntity(DisciplinaDTO.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().title()).isEqualTo(titulo);
    }

    @Test
    void registrarAula_comoProfessorSemVinculoComADisciplina_deveRetornar403ESemGravar() {
        DisciplinaDTO disciplina = criarDisciplina("Quimica " + System.nanoTime());
        String tokenProfessor = criarProfessorELogar();

        ResponseEntity<Void> response = client.post().uri(BASE_PATH + "/" + disciplina.id() + "/aulas")
                .header("Authorization", "Bearer " + tokenProfessor)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new AulaRequestDTO(DATA_AULA))
                .retrieve()
                .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(aulaRegistroRepository.countByDisciplinaId(disciplina.id())).isZero();
    }

    private ResponseEntity<Void> registrarAula(Long disciplinaId, LocalDate data) {
        return client.post().uri(BASE_PATH + "/" + disciplinaId + "/aulas")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new AulaRequestDTO(data))
                .retrieve()
                .toBodilessEntity();
    }

    private record ErroPadrao(Integer status, String message, String path) {
    }

    private record ErroValidacao(Integer status, String message, String path, List<CampoInvalido> errors) {
    }

    private record CampoInvalido(String fieldName, String message) {
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
