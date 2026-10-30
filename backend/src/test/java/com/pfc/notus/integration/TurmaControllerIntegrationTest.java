package com.pfc.notus.integration;

import com.pfc.notus.disciplina.dto.DisciplinaDTO;
import com.pfc.notus.lecionamento.dto.LecionamentoRequestDTO;
import com.pfc.notus.lecionamento.dto.TurmaComDisciplinasDTO;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.dto.TurmaAlunoRequestDTO;
import com.pfc.notus.turma.dto.TurmaAlunoResponseDTO;
import com.pfc.notus.turma.dto.TurmaDTO;
import com.pfc.notus.turma.dto.TurmaDetalheDTO;
import com.pfc.notus.turma.dto.TurmaRequestDTO;
import com.pfc.notus.turma.repository.TurmaRepository;
import com.pfc.notus.user.dto.ResponsibleRequest;
import com.pfc.notus.user.dto.StudentMinDTO;
import com.pfc.notus.user.dto.StudentRegistrationRequest;
import com.pfc.notus.user.dto.StudentRegistrationResponse;
import com.pfc.notus.user.dto.StudentRequest;
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

    @Test
    void listar_comTurmaCriada_deveRetornar200ComATurmaNaLista() {
        TurmaDTO criada = criarTurma("9C " + System.nanoTime());

        ResponseEntity<List<TurmaDTO>> response = client.get().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toEntity(new ParameterizedTypeReference<>() {});

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains(criada);
    }

    @Test
    void buscarPorId_comTurmaExistente_deveRetornar200ComDetalhes() {
        TurmaDTO criada = criarTurma("6D " + System.nanoTime());

        ResponseEntity<TurmaDetalheDTO> response = client.get().uri(BASE_PATH + "/" + criada.id())
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toEntity(TurmaDetalheDTO.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        TurmaDetalheDTO body = response.getBody();
        assertThat(body.id()).isEqualTo(criada.id());
        assertThat(body.name()).isEqualTo(criada.name());
        assertThat(body.schoolYear()).isEqualTo(ANO_LETIVO);
        assertThat(body.alunos()).isEmpty();
        assertThat(body.lecionamentos()).isEmpty();
    }

    @Test
    void buscarPorId_comIdInexistente_deveRetornar404ComMensagem() {
        long idInexistente = System.nanoTime();

        ResponseEntity<ErroPadrao> response = client.get().uri(BASE_PATH + "/" + idInexistente)
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toEntity(ErroPadrao.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().status()).isEqualTo(404);
        assertThat(response.getBody().message()).contains(String.valueOf(idInexistente));
    }

    @Test
    void minhasTurmas_comProfessorVinculado_deveRetornar200ComTurmaEDisciplina() {
        ProfessorLogado professor = criarProfessorLogado();
        TurmaDTO turma = criarTurma("5E " + System.nanoTime());
        DisciplinaDTO disciplina = criarDisciplina("Fisica " + System.nanoTime());
        vincularProfessor(turma.id(), disciplina.id(), professor.id());

        ResponseEntity<List<TurmaComDisciplinasDTO>> response = client.get().uri(BASE_PATH + "/me")
                .header("Authorization", "Bearer " + professor.token())
                .retrieve()
                .toEntity(new ParameterizedTypeReference<>() {});

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        TurmaComDisciplinasDTO minhaTurma = response.getBody().getFirst();
        assertThat(minhaTurma.turmaId()).isEqualTo(turma.id());
        assertThat(minhaTurma.turmaName()).isEqualTo(turma.name());
        assertThat(minhaTurma.schoolYear()).isEqualTo(ANO_LETIVO);
        assertThat(minhaTurma.disciplinas()).containsExactly(
                new TurmaComDisciplinasDTO.DisciplinaResumoDTO(disciplina.id(), disciplina.title()));
    }

    @Test
    void minhasTurmas_comProfessorSemVinculo_deveRetornar200ComListaVazia() {
        ProfessorLogado professor = criarProfessorLogado();

        ResponseEntity<List<TurmaComDisciplinasDTO>> response = client.get().uri(BASE_PATH + "/me")
                .header("Authorization", "Bearer " + professor.token())
                .retrieve()
                .toEntity(new ParameterizedTypeReference<>() {});

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    void atualizar_comDadosValidos_deveRetornar200EGravarONovoNome() {
        TurmaDTO criada = criarTurma("4F " + System.nanoTime());
        String novoNome = "4G " + System.nanoTime();

        ResponseEntity<TurmaDTO> response = client.put().uri(BASE_PATH + "/" + criada.id())
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TurmaRequestDTO(novoNome, "2027"))
                .retrieve()
                .toEntity(TurmaDTO.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().id()).isEqualTo(criada.id());
        assertThat(response.getBody().name()).isEqualTo(novoNome);
        assertThat(response.getBody().schoolYear()).isEqualTo("2027");

        Turma gravada = turmaRepository.findById(criada.id()).orElseThrow();
        assertThat(gravada.getName()).isEqualTo(novoNome);
        assertThat(gravada.getSchoolYear()).isEqualTo("2027");
    }

    @Test
    void atualizar_comIdInexistente_deveRetornar404ComMensagem() {
        long idInexistente = System.nanoTime();

        ResponseEntity<ErroPadrao> response = client.put().uri(BASE_PATH + "/" + idInexistente)
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TurmaRequestDTO("3H " + idInexistente, ANO_LETIVO))
                .retrieve()
                .toEntity(ErroPadrao.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().message()).contains(String.valueOf(idInexistente));
    }

    @Test
    void atualizar_comNomeDeOutraTurma_deveRetornar409EManterONomeOriginal() {
        TurmaDTO existente = criarTurma("3I " + System.nanoTime());
        TurmaDTO editada = criarTurma("3J " + System.nanoTime());

        ResponseEntity<ErroPadrao> response = client.put().uri(BASE_PATH + "/" + editada.id())
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TurmaRequestDTO(existente.name(), ANO_LETIVO))
                .retrieve()
                .toEntity(ErroPadrao.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().message()).contains(existente.name());
        assertThat(turmaRepository.findById(editada.id()).orElseThrow().getName()).isEqualTo(editada.name());
    }

    @Test
    void atualizar_comAnoLetivoEmBranco_deveRetornar422ComCampoInvalido() {
        TurmaDTO criada = criarTurma("3K " + System.nanoTime());

        ResponseEntity<ErroValidacao> response = client.put().uri(BASE_PATH + "/" + criada.id())
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TurmaRequestDTO(criada.name(), " "))
                .retrieve()
                .toEntity(ErroValidacao.class);

        assertThat(response.getStatusCode().value()).isEqualTo(422);
        assertThat(response.getBody().errors()).extracting(CampoInvalido::fieldName).containsExactly("schoolYear");
    }

    @Test
    void remover_comTurmaSemVinculos_deveRetornar204EBuscaSeguinteRetornar404() {
        TurmaDTO criada = criarTurma("2L " + System.nanoTime());

        ResponseEntity<Void> response = client.delete().uri(BASE_PATH + "/" + criada.id())
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(turmaRepository.findById(criada.id())).isEmpty();
        ResponseEntity<Void> busca = client.get().uri(BASE_PATH + "/" + criada.id())
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toBodilessEntity();
        assertThat(busca.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void remover_comIdInexistente_deveRetornar404ComMensagem() {
        long idInexistente = System.nanoTime();

        ResponseEntity<ErroPadrao> response = client.delete().uri(BASE_PATH + "/" + idInexistente)
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toEntity(ErroPadrao.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().message()).contains(String.valueOf(idInexistente));
    }

    @Test
    void associarAluno_comDadosValidos_deveRetornar200EAlunoAparecerNaTurma() {
        TurmaDTO turma = criarTurma("1M " + System.nanoTime());
        StudentRegistrationResponse aluno = criarAluno();

        ResponseEntity<TurmaAlunoResponseDTO> response = associarAluno(turma.id(), aluno.userId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        TurmaAlunoResponseDTO body = response.getBody();
        assertThat(body.turmaId()).isEqualTo(turma.id());
        assertThat(body.turmaName()).isEqualTo(turma.name());
        assertThat(body.studentId()).isEqualTo(aluno.userId());
        assertThat(body.studentName()).isEqualTo(aluno.studentName());
        assertThat(buscarTurma(turma.id()).alunos()).extracting(StudentMinDTO::userId).containsExactly(aluno.userId());
    }

    @Test
    void associarAluno_jaAssociadoAEstaTurma_deveRetornar409ComMensagem() {
        TurmaDTO turma = criarTurma("1N " + System.nanoTime());
        StudentRegistrationResponse aluno = criarAluno();
        associarAluno(turma.id(), aluno.userId());

        ResponseEntity<ErroPadrao> response = client.post().uri(BASE_PATH + "/" + turma.id() + "/alunos")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TurmaAlunoRequestDTO(aluno.userId()))
                .retrieve()
                .toEntity(ErroPadrao.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().message()).contains("associado");
    }

    @Test
    void associarAluno_comAlunoInexistente_deveRetornar404ComMensagem() {
        TurmaDTO turma = criarTurma("1O " + System.nanoTime());
        long idInexistente = System.nanoTime();

        ResponseEntity<ErroPadrao> response = client.post().uri(BASE_PATH + "/" + turma.id() + "/alunos")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TurmaAlunoRequestDTO(idInexistente))
                .retrieve()
                .toEntity(ErroPadrao.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().message()).contains(String.valueOf(idInexistente));
    }

    @Test
    void associarAluno_semIdDoAluno_deveRetornar422ComCampoInvalido() {
        TurmaDTO turma = criarTurma("1P " + System.nanoTime());

        ResponseEntity<ErroValidacao> response = client.post().uri(BASE_PATH + "/" + turma.id() + "/alunos")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TurmaAlunoRequestDTO(null))
                .retrieve()
                .toEntity(ErroValidacao.class);

        assertThat(response.getStatusCode().value()).isEqualTo(422);
        assertThat(response.getBody().errors()).extracting(CampoInvalido::fieldName).containsExactly("studentId");
    }

    @Test
    void remover_comAlunoAssociado_deveRetornar409EManterATurma() {
        TurmaDTO turma = criarTurma("1Q " + System.nanoTime());
        associarAluno(turma.id(), criarAluno().userId());

        ResponseEntity<ErroPadrao> response = client.delete().uri(BASE_PATH + "/" + turma.id())
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toEntity(ErroPadrao.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().message()).contains("alunos associados");
        assertThat(turmaRepository.findById(turma.id())).isPresent();
    }

    @Test
    void removerAluno_comAlunoAssociado_deveRetornar204ESairDaTurma() {
        TurmaDTO turma = criarTurma("1R " + System.nanoTime());
        StudentRegistrationResponse aluno = criarAluno();
        associarAluno(turma.id(), aluno.userId());

        ResponseEntity<Void> response = client.delete().uri(BASE_PATH + "/" + turma.id() + "/alunos/" + aluno.userId())
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(buscarTurma(turma.id()).alunos()).isEmpty();
    }

    @Test
    void removerAluno_semAssociacaoComATurma_deveRetornar409ComMensagem() {
        TurmaDTO turma = criarTurma("1S " + System.nanoTime());
        StudentRegistrationResponse aluno = criarAluno();

        ResponseEntity<ErroPadrao> response = client.delete().uri(BASE_PATH + "/" + turma.id() + "/alunos/" + aluno.userId())
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toEntity(ErroPadrao.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().message()).contains("associado");
    }

    @Test
    void removerAluno_comAlunoInexistente_deveRetornar404ComMensagem() {
        TurmaDTO turma = criarTurma("1T " + System.nanoTime());
        long idInexistente = System.nanoTime();

        ResponseEntity<ErroPadrao> response = client.delete().uri(BASE_PATH + "/" + turma.id() + "/alunos/" + idInexistente)
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toEntity(ErroPadrao.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().message()).contains(String.valueOf(idInexistente));
    }

    @Test
    void listar_semToken_deveRetornar401() {
        ResponseEntity<Void> response = client.get().uri(BASE_PATH)
                .retrieve()
                .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void listar_comoProfessor_deveRetornar403() {
        String tokenProfessor = criarProfessorELogar();

        ResponseEntity<Void> response = client.get().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenProfessor)
                .retrieve()
                .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void listar_comoAdmin_deveRetornar200ComLista() {
        TurmaDTO criada = criarTurma("0U " + System.nanoTime());

        ResponseEntity<List<TurmaDTO>> response = client.get().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .toEntity(new ParameterizedTypeReference<>() {});

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).extracting(TurmaDTO::id).contains(criada.id());
    }

    @Test
    void buscarPorId_comoProfessorSemVinculoComATurma_deveRetornar403() {
        TurmaDTO turma = criarTurma("0V " + System.nanoTime());
        String tokenProfessor = criarProfessorELogar();

        ResponseEntity<Void> response = client.get().uri(BASE_PATH + "/" + turma.id())
                .header("Authorization", "Bearer " + tokenProfessor)
                .retrieve()
                .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void criar_comoProfessor_deveRetornar403ESemGravar() {
        String nome = "0W " + System.nanoTime();
        String tokenProfessor = criarProfessorELogar();

        ResponseEntity<Void> response = client.post().uri(BASE_PATH)
                .header("Authorization", "Bearer " + tokenProfessor)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TurmaRequestDTO(nome, ANO_LETIVO))
                .retrieve()
                .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(turmaRepository.existsByNameAndSchoolYear(nome, ANO_LETIVO)).isFalse();
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

    private DisciplinaDTO criarDisciplina(String titulo) {
        return client.post().uri("/disciplina")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new DisciplinaDTO(null, titulo, "Descricao de " + titulo, LocalDateTime.of(2026, 3, 2, 8, 0)))
                .retrieve()
                .body(DisciplinaDTO.class);
    }

    private void vincularProfessor(Long turmaId, Long disciplinaId, Long professorId) {
        client.post().uri("/lecionamento")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LecionamentoRequestDTO(turmaId, disciplinaId, professorId))
                .retrieve()
                .toBodilessEntity();
    }

    private StudentRegistrationResponse criarAluno() {
        buscarOuCriarRole("ROLE_ALUNO");
        buscarOuCriarRole("ROLE_RESPONSAVEL");
        long ts = System.nanoTime();
        ResponsibleRequest responsavel = new ResponsibleRequest("Responsavel " + ts, "responsavel." + ts + "@teste.com", "11999998888");
        StudentRequest aluno = new StudentRequest("Aluno " + ts, "aluno." + ts + "@teste.com", ts, LocalDate.of(2012, 5, 10));
        return client.post().uri("/students")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new StudentRegistrationRequest(responsavel, aluno))
                .retrieve()
                .body(StudentRegistrationResponse.class);
    }

    private ResponseEntity<TurmaAlunoResponseDTO> associarAluno(Long turmaId, Long studentId) {
        return client.post().uri(BASE_PATH + "/" + turmaId + "/alunos")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TurmaAlunoRequestDTO(studentId))
                .retrieve()
                .toEntity(TurmaAlunoResponseDTO.class);
    }

    private TurmaDetalheDTO buscarTurma(Long turmaId) {
        return client.get().uri(BASE_PATH + "/" + turmaId)
                .header("Authorization", "Bearer " + tokenAdmin)
                .retrieve()
                .body(TurmaDetalheDTO.class);
    }
}
