package com.pfc.notus.atividade.service;

import com.pfc.notus.atividade.domain.Atividade;
import com.pfc.notus.atividade.dto.AtividadeDTO;
import com.pfc.notus.atividade.repository.AtividadeRepository;
import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.entrega.domain.Entrega;
import com.pfc.notus.entrega.domain.StatusEntrega;
import com.pfc.notus.entrega.repository.EntregaRepository;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.lecionamento.domain.Lecionamento;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import com.pfc.notus.notificacao.event.AtividadePublicadaEvent;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.repository.TurmaRepository;
import com.pfc.notus.user.domain.Professor;
import com.pfc.notus.user.domain.Role;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AtividadeServiceUnitTest {

    private static final String PROFESSOR = "pedro.professor@gmail.com";
    private static final String ADMIN = "admin@notus.com";
    private static final String ALUNO = "ana.aluna@gmail.com";

    @Mock
    private AtividadeRepository atividadeRepository;

    @Mock
    private TurmaRepository turmaRepository;

    @Mock
    private DisiciplinaRepository disciplinaRepository;

    @Mock
    private LecionamentoRepository lecionamentoRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EntregaRepository entregaRepository;

    @Mock
    private StudentAccessGuardService studentAccessGuardService;

    @Mock
    private NotificacaoService notificacaoService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AtividadeService atividadeService;

    private <T extends User> T comIdEPapel(T usuario, Long id, String papel) {
        ReflectionTestUtils.setField(usuario, "id", id);
        usuario.addRole(new Role(null, papel));
        return usuario;
    }

    private Professor criarProfessor() {
        return comIdEPapel(new Professor("Pedro Professor", PROFESSOR), 2L, "ROLE_PROFESSOR");
    }

    private Turma criarTurma(Long id, String nome) {
        Turma turma = new Turma(nome, "2026");
        ReflectionTestUtils.setField(turma, "id", id);
        return turma;
    }

    private Disciplina criarDisciplina(Long id, String titulo) {
        Disciplina disciplina = new Disciplina(titulo, titulo);
        ReflectionTestUtils.setField(disciplina, "id", id);
        return disciplina;
    }

    private Atividade criarAtividade(Long id, Turma turma, Disciplina disciplina) {
        Atividade atividade = new Atividade("Lista 1", "Exercícios da página 10");
        ReflectionTestUtils.setField(atividade, "id", id);
        atividade.setBimestre(Bimestre.QUARTO);
        atividade.setPrazo(LocalDate.now().plusDays(7));
        atividade.setPublicadaEm(LocalDateTime.now());
        atividade.setTurma(turma);
        atividade.setDisciplina(disciplina);
        return atividade;
    }

    private AtividadeDTO pedido(LocalDate prazo, Long turmaId, Long disciplinaId) {
        return pedido(prazo, turmaId, disciplinaId, null);
    }

    private AtividadeDTO pedido(LocalDate prazo, Long turmaId, Long disciplinaId, Float pontos) {
        return new AtividadeDTO(null, "  Lista 1  ", "Exercícios da página 10", Bimestre.QUARTO, prazo, turmaId,
                disciplinaId, null, null, null, null, pontos);
    }

    @Test
    void deveDeduzirADisciplinaPeloLecionamentoQuandoProfessorPublica() {
        Professor professor = criarProfessor();
        Turma turma = criarTurma(1L, "9º Ano A");
        Disciplina matematica = criarDisciplina(5L, "Matemática");
        when(userRepository.findByEmail(PROFESSOR)).thenReturn(Optional.of(professor));
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(turma));
        when(lecionamentoRepository.findByProfessorId(2L))
                .thenReturn(List.of(new Lecionamento(turma, matematica, professor)));
        when(atividadeRepository.save(any(Atividade.class))).thenAnswer(invocacao -> {
            Atividade salva = invocacao.getArgument(0);
            ReflectionTestUtils.setField(salva, "id", 100L);
            return salva;
        });

        AtividadeDTO resultado = atividadeService.publicar(pedido(LocalDate.now().plusDays(3), 1L, null, 1.5f), PROFESSOR);

        assertEquals(100L, resultado.id());
        assertEquals("Lista 1", resultado.title());
        assertEquals(Bimestre.QUARTO, resultado.bimestre());
        assertEquals(5L, resultado.disciplinaId());
        assertEquals("Matemática", resultado.disciplinaTitle());
        assertEquals("9º Ano A", resultado.turmaName());
        assertEquals(1.5f, resultado.pontos());
        verify(eventPublisher).publishEvent(new AtividadePublicadaEvent(100L));
    }

    @Test
    void deveRecusarAtividadeComPontosForaDoIntervalo() {
        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> atividadeService.publicar(pedido(LocalDate.now().plusDays(3), 1L, null, 10.5f), PROFESSOR));

        assertEquals("Os pontos da atividade devem ser maiores que 0 e no máximo 10.", excecao.getMessage());
        verify(userRepository, never()).findByEmail(anyString());
        verify(atividadeRepository, never()).save(any());
    }

    @Test
    void deveRecusarPublicacaoQuandoProfessorNaoLecionaNaTurma() {
        Professor professor = criarProfessor();
        Turma outraTurma = criarTurma(2L, "9º Ano B");
        when(userRepository.findByEmail(PROFESSOR)).thenReturn(Optional.of(professor));
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(criarTurma(1L, "9º Ano A")));
        when(lecionamentoRepository.findByProfessorId(2L))
                .thenReturn(List.of(new Lecionamento(outraTurma, criarDisciplina(5L, "Matemática"), professor)));

        AccessDeniedException excecao = assertThrows(AccessDeniedException.class,
                () -> atividadeService.publicar(pedido(LocalDate.now().plusDays(3), 1L, null), PROFESSOR));

        assertEquals("Você não leciona nesta turma.", excecao.getMessage());
        verify(atividadeRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void deveRecusarQuandoProfessorTentaPublicarEmOutraDisciplina() {
        Professor professor = criarProfessor();
        Turma turma = criarTurma(1L, "9º Ano A");
        when(userRepository.findByEmail(PROFESSOR)).thenReturn(Optional.of(professor));
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(turma));
        when(lecionamentoRepository.findByProfessorId(2L))
                .thenReturn(List.of(new Lecionamento(turma, criarDisciplina(5L, "Matemática"), professor)));

        AccessDeniedException excecao = assertThrows(AccessDeniedException.class,
                () -> atividadeService.publicar(pedido(LocalDate.now().plusDays(3), 1L, 6L), PROFESSOR));

        assertEquals("Você só pode publicar atividades das disciplinas que leciona nesta turma.", excecao.getMessage());
        verify(atividadeRepository, never()).save(any());
    }

    @Test
    void deveExigirADisciplinaQuandoProfessorLecionaMaisDeUmaNaTurma() {
        Professor professor = criarProfessor();
        Turma turma = criarTurma(1L, "3º Ano A");
        when(userRepository.findByEmail(PROFESSOR)).thenReturn(Optional.of(professor));
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(turma));
        when(lecionamentoRepository.findByProfessorId(2L)).thenReturn(List.of(
                new Lecionamento(turma, criarDisciplina(5L, "Matemática"), professor),
                new Lecionamento(turma, criarDisciplina(6L, "Português"), professor)));

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> atividadeService.publicar(pedido(LocalDate.now().plusDays(3), 1L, null), PROFESSOR));

        assertEquals("Informe a disciplina da atividade.", excecao.getMessage());
        verify(atividadeRepository, never()).save(any());
    }

    @Test
    void devePublicarNaDisciplinaEscolhidaQuandoProfessorLecionaMaisDeUmaNaTurma() {
        Professor professor = criarProfessor();
        Turma turma = criarTurma(1L, "3º Ano A");
        when(userRepository.findByEmail(PROFESSOR)).thenReturn(Optional.of(professor));
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(turma));
        when(lecionamentoRepository.findByProfessorId(2L)).thenReturn(List.of(
                new Lecionamento(turma, criarDisciplina(5L, "Matemática"), professor),
                new Lecionamento(turma, criarDisciplina(6L, "Português"), professor)));
        when(atividadeRepository.save(any(Atividade.class))).thenAnswer(invocacao -> {
            Atividade salva = invocacao.getArgument(0);
            ReflectionTestUtils.setField(salva, "id", 101L);
            return salva;
        });

        AtividadeDTO resultado = atividadeService.publicar(pedido(LocalDate.now().plusDays(3), 1L, 6L), PROFESSOR);

        assertEquals(6L, resultado.disciplinaId());
        assertEquals("Português", resultado.disciplinaTitle());
        verify(eventPublisher).publishEvent(new AtividadePublicadaEvent(101L));
    }

    @Test
    void deveRecusarAtividadeComPrazoNoPassado() {
        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> atividadeService.publicar(pedido(LocalDate.now().minusDays(1), 1L, null), PROFESSOR));

        assertEquals("O prazo da atividade não pode ser uma data passada.", excecao.getMessage());
        verify(userRepository, never()).findByEmail(anyString());
        verify(atividadeRepository, never()).save(any());
    }

    @Test
    void deveRecusarAtividadeSemBimestre() {
        AtividadeDTO semBimestre = new AtividadeDTO(null, "Lista 1", "Exercícios da página 10", null,
                LocalDate.now().plusDays(3), 1L, null, null, null, null, null, null);

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> atividadeService.publicar(semBimestre, PROFESSOR));

        assertEquals("Informe o bimestre da atividade.", excecao.getMessage());
        verify(userRepository, never()).findByEmail(anyString());
        verify(atividadeRepository, never()).save(any());
    }

    @Test
    void deveExigirADisciplinaQuandoAdminPublica() {
        User admin = comIdEPapel(new User(ADMIN), 4L, "ROLE_ADMIN");
        when(userRepository.findByEmail(ADMIN)).thenReturn(Optional.of(admin));
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(criarTurma(1L, "9º Ano A")));

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> atividadeService.publicar(pedido(LocalDate.now().plusDays(3), 1L, null), ADMIN));

        assertEquals("Informe a disciplina da atividade.", excecao.getMessage());
        verify(atividadeRepository, never()).save(any());
    }

    @Test
    void deveMarcarComoEntregueSoAsAtividadesQueOAlunoEntregou() {
        Turma turma = criarTurma(1L, "9º Ano A");
        Student aluno = new Student("Ana Aluna", ALUNO, 20260001L, LocalDate.of(2012, 5, 10), null);
        aluno.setTurma(turma);
        comIdEPapel(aluno, 10L, "ROLE_ALUNO");
        Disciplina matematica = criarDisciplina(5L, "Matemática");
        Atividade entregue = criarAtividade(1L, turma, matematica);
        Atividade pendente = criarAtividade(2L, turma, matematica);
        Entrega entrega = new Entrega(entregue, aluno);
        entrega.setStatus(StatusEntrega.ENTREGUE);
        Entrega naoEntregue = new Entrega(pendente, aluno);
        naoEntregue.setStatus(StatusEntrega.NAO_ENTREGUE);

        when(userRepository.findByEmail(ALUNO)).thenReturn(Optional.of(aluno));
        when(entregaRepository.findByStudentId(10L)).thenReturn(List.of(entrega, naoEntregue));
        when(atividadeRepository.findByTurmaIdOrderByPrazoAsc(1L)).thenReturn(List.of(entregue, pendente));

        List<AtividadeDTO> resultado = atividadeService.getMinhas(ALUNO);

        assertEquals(2, resultado.size());
        assertEquals(true, resultado.get(0).entregue());
        assertEquals(false, resultado.get(1).entregue());
    }

    @Test
    void deveRecusarExclusaoQuandoAtividadeJaTemEntregas() {
        Professor professor = criarProfessor();
        Atividade atividade = criarAtividade(1L, criarTurma(1L, "9º Ano A"), criarDisciplina(5L, "Matemática"));
        when(atividadeRepository.findById(1L)).thenReturn(Optional.of(atividade));
        when(userRepository.findByEmail(PROFESSOR)).thenReturn(Optional.of(professor));
        when(lecionamentoRepository.existsByProfessorIdAndTurmaIdAndDisciplinaId(2L, 1L, 5L)).thenReturn(true);
        when(entregaRepository.existsByAtividadeId(1L)).thenReturn(true);

        ConflictException excecao = assertThrows(ConflictException.class,
                () -> atividadeService.delete(1L, PROFESSOR));

        assertEquals("A atividade já tem entregas e não pode ser excluída.", excecao.getMessage());
        verify(atividadeRepository, never()).delete(any());
    }

    @Test
    void deveExcluirAtividadeECancelarOsAvisosAindaNaoEnviados() {
        Professor professor = criarProfessor();
        Atividade atividade = criarAtividade(1L, criarTurma(1L, "9º Ano A"), criarDisciplina(5L, "Matemática"));
        when(atividadeRepository.findById(1L)).thenReturn(Optional.of(atividade));
        when(userRepository.findByEmail(PROFESSOR)).thenReturn(Optional.of(professor));
        when(lecionamentoRepository.existsByProfessorIdAndTurmaIdAndDisciplinaId(2L, 1L, 5L)).thenReturn(true);
        when(entregaRepository.existsByAtividadeId(1L)).thenReturn(false);

        atividadeService.delete(1L, PROFESSOR);

        verify(atividadeRepository).delete(atividade);
        verify(notificacaoService).cancelarPorReferencia(NotificacaoService.REF_ATIVIDADE, 1L,
                "Atividade excluída antes do envio");
    }
}
