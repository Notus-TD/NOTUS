package com.pfc.notus.nota.service;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.dto.NotaRequestDTO;
import com.pfc.notus.nota.repository.NotaRepository;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
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
class NotaServiceUnitTest {

    private static final String PROFESSOR = "pedro.professor@gmail.com";

    @Mock
    private NotaRepository notaRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private DisiciplinaRepository disciplinaRepository;

    @Mock
    private StudentAccessGuardService studentAccessGuardService;

    @InjectMocks
    private NotaService notaService;

    private Student criarAluno(Long id) {
        Student aluno = new Student("Ana Aluna", "ana.aluna@gmail.com", 20260001L, LocalDate.of(2012, 5, 10), null);
        ReflectionTestUtils.setField(aluno, "id", id);
        return aluno;
    }

    private Disciplina criarDisciplina(Long id, String titulo) {
        Disciplina disciplina = new Disciplina(titulo, titulo);
        ReflectionTestUtils.setField(disciplina, "id", id);
        return disciplina;
    }

    private Nota criarNota(Long id, Student aluno, Disciplina disciplina) {
        Nota nota = new Nota("Prova 1", 7f, Bimestre.PRIMEIRO);
        ReflectionTestUtils.setField(nota, "id", id);
        nota.setStudent(aluno);
        nota.setDisciplina(disciplina);
        return nota;
    }

    private NotaRequestDTO pedido(float valor) {
        return new NotaRequestDTO("  Prova 1  ", valor, Bimestre.PRIMEIRO, 10L, 5L);
    }

    @Test
    void deveLancarNotaQuandoProfessorLecionaADisciplinaDoAluno() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(criarAluno(10L)));
        when(disciplinaRepository.findById(5L)).thenReturn(Optional.of(criarDisciplina(5L, "Matemática")));
        when(notaRepository.save(any(Nota.class))).thenAnswer(invocacao -> {
            Nota salva = invocacao.getArgument(0);
            ReflectionTestUtils.setField(salva, "id", 100L);
            return salva;
        });

        NotaDTO resultado = notaService.save(pedido(8.5f), PROFESSOR);

        assertEquals(100L, resultado.id());
        assertEquals("Prova 1", resultado.descricao());
        assertEquals(8.5f, resultado.rate());
        assertEquals(Bimestre.PRIMEIRO, resultado.bimestre());
        assertEquals(10L, resultado.studentId());
        assertEquals(5L, resultado.disciplinaId());
        assertEquals("Matemática", resultado.disciplinaTitle());
        verify(studentAccessGuardService).assertCanTeach(10L, 5L, PROFESSOR);
    }

    @ParameterizedTest
    @ValueSource(floats = {-0.1f, 10.1f, Float.NaN})
    void deveRecusarNotaForaDoIntervaloSemConsultarNada(float valor) {
        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> notaService.save(pedido(valor), PROFESSOR));

        assertEquals("A nota deve estar entre 0 e 10.", excecao.getMessage());
        verify(studentRepository, never()).findById(anyLong());
        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveRecusarAvaliacaoSemDescricao() {
        NotaRequestDTO semDescricao = new NotaRequestDTO("   ", 7f, Bimestre.PRIMEIRO, 10L, 5L);

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> notaService.save(semDescricao, PROFESSOR));

        assertEquals("Informe a descrição da avaliação.", excecao.getMessage());
        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveRecusarAvaliacaoSemBimestre() {
        NotaRequestDTO semBimestre = new NotaRequestDTO("Prova 1", 7f, null, 10L, 5L);

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> notaService.save(semBimestre, PROFESSOR));

        assertEquals("Informe o bimestre da avaliação.", excecao.getMessage());
        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveLancarExcecaoQuandoAlunoNaoExiste() {
        when(studentRepository.findById(10L)).thenReturn(Optional.empty());

        ResourceNotFoundException excecao = assertThrows(ResourceNotFoundException.class,
                () -> notaService.save(pedido(7f), PROFESSOR));

        assertEquals("Aluno não encontrado com o id: 10", excecao.getMessage());
        verify(studentAccessGuardService, never()).assertCanTeach(anyLong(), anyLong(), anyString());
        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveBloquearLancamentoQuandoProfessorNaoLecionaADisciplinaDoAluno() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(criarAluno(10L)));
        doThrow(new AccessDeniedException("Sem permissão para lançar dados desta disciplina para este aluno."))
                .when(studentAccessGuardService).assertCanTeach(10L, 5L, PROFESSOR);

        AccessDeniedException excecao = assertThrows(AccessDeniedException.class,
                () -> notaService.save(pedido(7f), PROFESSOR));

        assertEquals("Sem permissão para lançar dados desta disciplina para este aluno.", excecao.getMessage());
        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveAtualizarDescricaoValorEBimestreDaNota() {
        Nota nota = criarNota(100L, criarAluno(10L), criarDisciplina(5L, "Matemática"));
        when(notaRepository.findById(100L)).thenReturn(Optional.of(nota));
        when(notaRepository.save(nota)).thenReturn(nota);

        NotaDTO resultado = notaService.update(100L,
                new NotaRequestDTO("Prova 2", 9f, Bimestre.SEGUNDO, 10L, 5L), PROFESSOR);

        assertEquals("Prova 2", resultado.descricao());
        assertEquals(9f, resultado.rate());
        assertEquals(Bimestre.SEGUNDO, resultado.bimestre());
        verify(studentAccessGuardService).assertCanTeach(10L, 5L, PROFESSOR);
    }

    @Test
    void deveRecusarTrocaDeAlunoOuDisciplinaNaEdicao() {
        Nota nota = criarNota(100L, criarAluno(10L), criarDisciplina(5L, "Matemática"));
        when(notaRepository.findById(100L)).thenReturn(Optional.of(nota));

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> notaService.update(100L, new NotaRequestDTO("Prova 1", 7f, Bimestre.PRIMEIRO, 10L, 6L), PROFESSOR));

        assertEquals("Não é possível trocar o aluno ou a disciplina de uma nota.", excecao.getMessage());
        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveLancarExcecaoAoEditarNotaInexistente() {
        when(notaRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException excecao = assertThrows(ResourceNotFoundException.class,
                () -> notaService.update(99L, pedido(7f), PROFESSOR));

        assertEquals("Nota não encontrada com o id: 99", excecao.getMessage());
        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveExcluirNotaQuandoProfessorLecionaADisciplina() {
        Nota nota = criarNota(100L, criarAluno(10L), criarDisciplina(5L, "Matemática"));
        when(notaRepository.findById(100L)).thenReturn(Optional.of(nota));

        notaService.delete(100L, PROFESSOR);

        verify(studentAccessGuardService).assertCanTeach(10L, 5L, PROFESSOR);
        verify(notaRepository).delete(nota);
    }

    @Test
    void deveListarAsNotasDoAlunoDepoisDeValidarOAcesso() {
        Student aluno = criarAluno(10L);
        Disciplina matematica = criarDisciplina(5L, "Matemática");
        when(notaRepository.findByStudentIdOrderByIdAsc(10L))
                .thenReturn(List.of(criarNota(100L, aluno, matematica), criarNota(101L, aluno, matematica)));

        List<NotaDTO> resultado = notaService.getByStudent(10L, PROFESSOR);

        assertEquals(2, resultado.size());
        assertEquals(100L, resultado.get(0).id());
        verify(studentAccessGuardService).assertCanView(10L, PROFESSOR);
    }
}
