package com.pfc.notus.entrega.service;

import com.pfc.notus.atividade.domain.Atividade;
import com.pfc.notus.atividade.repository.AtividadeRepository;
import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.entrega.domain.Entrega;
import com.pfc.notus.entrega.domain.StatusEntrega;
import com.pfc.notus.entrega.dto.EntregaDTO;
import com.pfc.notus.entrega.dto.EntregaRequestDTO;
import com.pfc.notus.entrega.repository.EntregaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EntregaServiceUnitTest {

    private static final String PROFESSOR = "pedro.professor@gmail.com";

    @Mock
    private EntregaRepository entregaRepository;

    @Mock
    private AtividadeRepository atividadeRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentAccessGuardService studentAccessGuardService;

    @InjectMocks
    private EntregaService entregaService;

    private Turma criarTurma(Long id) {
        Turma turma = new Turma("9º Ano A", "2026");
        ReflectionTestUtils.setField(turma, "id", id);
        return turma;
    }

    private Atividade criarAtividade(Turma turma) {
        Disciplina matematica = new Disciplina("Matemática", "Matemática");
        ReflectionTestUtils.setField(matematica, "id", 5L);
        Atividade atividade = new Atividade("Lista 1", "Exercícios da página 10");
        ReflectionTestUtils.setField(atividade, "id", 1L);
        atividade.setBimestre(Bimestre.QUARTO);
        atividade.setTurma(turma);
        atividade.setDisciplina(matematica);
        return atividade;
    }

    private Student criarAluno(Turma turma) {
        Student aluno = new Student("Ana Aluna", "ana.aluna@gmail.com", 20260001L, LocalDate.of(2012, 5, 10), null);
        ReflectionTestUtils.setField(aluno, "id", 10L);
        aluno.setTurma(turma);
        return aluno;
    }

    @Test
    void deveCriarAEntregaQuandoAindaNaoFoiMarcada() {
        Turma turma = criarTurma(1L);
        when(atividadeRepository.findById(1L)).thenReturn(Optional.of(criarAtividade(turma)));
        when(studentRepository.findById(10L)).thenReturn(Optional.of(criarAluno(turma)));
        when(entregaRepository.findByAtividadeIdAndStudentId(1L, 10L)).thenReturn(Optional.empty());
        when(entregaRepository.save(any(Entrega.class))).thenAnswer(invocacao -> {
            Entrega salva = invocacao.getArgument(0);
            ReflectionTestUtils.setField(salva, "id", 30L);
            return salva;
        });

        EntregaDTO resultado = entregaService.marcar(new EntregaRequestDTO(1L, 10L, StatusEntrega.ENTREGUE), PROFESSOR);

        assertEquals(30L, resultado.id());
        assertEquals(StatusEntrega.ENTREGUE, resultado.status());
        assertEquals(Bimestre.QUARTO, resultado.bimestre());
        assertEquals(5L, resultado.disciplinaId());
        verify(studentAccessGuardService).assertCanTeach(10L, 5L, PROFESSOR);
    }

    @Test
    void deveAtualizarOStatusQuandoAEntregaJaFoiMarcada() {
        Turma turma = criarTurma(1L);
        Atividade atividade = criarAtividade(turma);
        Student aluno = criarAluno(turma);
        Entrega existente = new Entrega(atividade, aluno);
        ReflectionTestUtils.setField(existente, "id", 30L);
        existente.setStatus(StatusEntrega.NAO_ENTREGUE);
        when(atividadeRepository.findById(1L)).thenReturn(Optional.of(atividade));
        when(studentRepository.findById(10L)).thenReturn(Optional.of(aluno));
        when(entregaRepository.findByAtividadeIdAndStudentId(1L, 10L)).thenReturn(Optional.of(existente));
        when(entregaRepository.save(existente)).thenReturn(existente);

        EntregaDTO resultado = entregaService.marcar(new EntregaRequestDTO(1L, 10L, StatusEntrega.ATRASADA), PROFESSOR);

        assertEquals(30L, resultado.id());
        assertEquals(StatusEntrega.ATRASADA, resultado.status());
    }

    @Test
    void deveSalvarOsPontosObtidosDentroDoValorDaAtividade() {
        Turma turma = criarTurma(1L);
        Atividade atividade = criarAtividade(turma);
        atividade.setPontos(2f);
        when(atividadeRepository.findById(1L)).thenReturn(Optional.of(atividade));
        when(studentRepository.findById(10L)).thenReturn(Optional.of(criarAluno(turma)));
        when(entregaRepository.findByAtividadeIdAndStudentId(1L, 10L)).thenReturn(Optional.empty());
        when(entregaRepository.save(any(Entrega.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        EntregaDTO resultado = entregaService.marcar(
                new EntregaRequestDTO(1L, 10L, StatusEntrega.ATRASADA, 1.5f), PROFESSOR);

        assertEquals(2f, resultado.pontos());
        assertEquals(1.5f, resultado.pontosObtidos());
    }

    @Test
    void deveZerarOsPontosQuandoAtividadeNaoFoiEntregue() {
        Turma turma = criarTurma(1L);
        Atividade atividade = criarAtividade(turma);
        atividade.setPontos(2f);
        when(atividadeRepository.findById(1L)).thenReturn(Optional.of(atividade));
        when(studentRepository.findById(10L)).thenReturn(Optional.of(criarAluno(turma)));
        when(entregaRepository.findByAtividadeIdAndStudentId(1L, 10L)).thenReturn(Optional.empty());
        when(entregaRepository.save(any(Entrega.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        EntregaDTO resultado = entregaService.marcar(
                new EntregaRequestDTO(1L, 10L, StatusEntrega.NAO_ENTREGUE, 1.5f), PROFESSOR);

        assertEquals(0f, resultado.pontosObtidos());
    }

    @Test
    void deveRecusarPontosObtidosAcimaDoValorDaAtividade() {
        Turma turma = criarTurma(1L);
        Atividade atividade = criarAtividade(turma);
        atividade.setPontos(1f);
        when(atividadeRepository.findById(1L)).thenReturn(Optional.of(atividade));
        when(studentRepository.findById(10L)).thenReturn(Optional.of(criarAluno(turma)));
        when(entregaRepository.findByAtividadeIdAndStudentId(1L, 10L)).thenReturn(Optional.empty());

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> entregaService.marcar(new EntregaRequestDTO(1L, 10L, StatusEntrega.ENTREGUE, 1.5f), PROFESSOR));

        assertEquals("Os pontos obtidos devem estar entre 0 e 1,0.", excecao.getMessage());
        verify(entregaRepository, never()).save(any());
    }

    @Test
    void deveRecusarEntregaSemStatus() {
        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> entregaService.marcar(new EntregaRequestDTO(1L, 10L, null), PROFESSOR));

        assertEquals("Informe o status da entrega.", excecao.getMessage());
        verify(atividadeRepository, never()).findById(anyLong());
    }

    @Test
    void deveRecusarEntregaDeAlunoDeOutraTurma() {
        when(atividadeRepository.findById(1L)).thenReturn(Optional.of(criarAtividade(criarTurma(1L))));
        when(studentRepository.findById(10L)).thenReturn(Optional.of(criarAluno(criarTurma(2L))));

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> entregaService.marcar(new EntregaRequestDTO(1L, 10L, StatusEntrega.ENTREGUE), PROFESSOR));

        assertEquals("O aluno não pertence à turma desta atividade.", excecao.getMessage());
        verify(studentAccessGuardService, never()).assertCanTeach(anyLong(), anyLong(), anyString());
        verify(entregaRepository, never()).save(any());
    }

    @Test
    void deveLancarExcecaoQuandoAtividadeNaoExiste() {
        when(atividadeRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException excecao = assertThrows(ResourceNotFoundException.class,
                () -> entregaService.marcar(new EntregaRequestDTO(1L, 10L, StatusEntrega.ENTREGUE), PROFESSOR));

        assertEquals("Atividade não encontrada com o id: 1", excecao.getMessage());
        verify(entregaRepository, never()).save(any());
    }

    @Test
    void deveListarAsEntregasDaAtividadeQuandoProfessorLecionaNaTurma() {
        Turma turma = criarTurma(1L);
        Atividade atividade = criarAtividade(turma);
        Entrega entrega = new Entrega(atividade, criarAluno(turma));
        entrega.setStatus(StatusEntrega.ENTREGUE);
        when(atividadeRepository.findById(1L)).thenReturn(Optional.of(atividade));
        when(entregaRepository.findByAtividadeId(1L)).thenReturn(List.of(entrega));

        List<EntregaDTO> resultado = entregaService.getByAtividade(1L, PROFESSOR);

        assertEquals(1, resultado.size());
        assertEquals(10L, resultado.get(0).studentId());
        verify(studentAccessGuardService).assertCanTeachTurma(1L, 5L, PROFESSOR);
    }

    @Test
    void deveBloquearListagemQuandoProfessorNaoLecionaNaTurma() {
        when(atividadeRepository.findById(1L)).thenReturn(Optional.of(criarAtividade(criarTurma(1L))));
        doThrow(new AccessDeniedException("Sem permissão para esta disciplina nesta turma."))
                .when(studentAccessGuardService).assertCanTeachTurma(1L, 5L, PROFESSOR);

        AccessDeniedException excecao = assertThrows(AccessDeniedException.class,
                () -> entregaService.getByAtividade(1L, PROFESSOR));

        assertEquals("Sem permissão para esta disciplina nesta turma.", excecao.getMessage());
        verify(entregaRepository, never()).findByAtividadeId(anyLong());
    }
}
