package com.pfc.notus.boletim.service;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.dto.BoletimDisciplinaDTO;
import com.pfc.notus.boletim.dto.NotaFinalRequestDTO;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.atividade.domain.Atividade;
import com.pfc.notus.entrega.domain.Entrega;
import com.pfc.notus.entrega.domain.StatusEntrega;
import com.pfc.notus.entrega.repository.EntregaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.repository.NotaRepository;
import com.pfc.notus.notificacao.event.NotaFinalLancadaEvent;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.user.domain.Professor;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BoletimServiceUnitTest {

    private static final String PROFESSOR = "pedro.professor@gmail.com";

    @Mock
    private BoletimRepository boletimRepository;

    @Mock
    private NotaRepository notaRepository;

    @Mock
    private EntregaRepository entregaRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private DisiciplinaRepository disciplinaRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentAccessGuardService studentAccessGuardService;

    @Mock
    private NotificacaoService notificacaoService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private BoletimService boletimService;

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

    private Professor criarProfessor() {
        Professor professor = new Professor("Pedro Professor", PROFESSOR);
        ReflectionTestUtils.setField(professor, "id", 2L);
        return professor;
    }

    private Nota criarNota(float valor, Bimestre bimestre, Student aluno, Disciplina disciplina) {
        Nota nota = new Nota("Prova", valor, bimestre);
        nota.setStudent(aluno);
        nota.setDisciplina(disciplina);
        return nota;
    }

    private Boletim criarNotaFinal(Long id, float valor, Bimestre bimestre, Student aluno, Disciplina disciplina) {
        Boletim boletim = new Boletim(aluno, disciplina, bimestre);
        ReflectionTestUtils.setField(boletim, "id", id);
        boletim.setNotaFinal(valor);
        boletim.setLancadoEm(LocalDateTime.of(2026, 4, 30, 18, 0));
        return boletim;
    }

    @Test
    void deveMontarOBoletimComNotaDoBimestreEMediaFinal() {
        Student aluno = criarAluno(10L);
        Disciplina matematica = criarDisciplina(5L, "Matemática");
        Disciplina portugues = criarDisciplina(6L, "Português");
        when(notaRepository.findByStudentIdOrderByIdAsc(10L)).thenReturn(List.of(
                criarNota(8f, Bimestre.PRIMEIRO, aluno, matematica),
                criarNota(9f, Bimestre.PRIMEIRO, aluno, matematica),
                criarNota(6f, Bimestre.SEGUNDO, aluno, matematica),
                criarNota(5f, Bimestre.TERCEIRO, aluno, matematica),
                criarNota(7f, Bimestre.PRIMEIRO, aluno, portugues)));
        when(boletimRepository.findByStudentId(10L))
                .thenReturn(List.of(criarNotaFinal(1L, 10f, Bimestre.PRIMEIRO, aluno, matematica)));

        List<BoletimDisciplinaDTO> resultado = boletimService.getByStudent(10L, PROFESSOR);

        assertEquals(2, resultado.size());
        BoletimDisciplinaDTO mat = resultado.get(0);
        assertEquals("Matemática", mat.disciplinaTitle());
        assertEquals(3, mat.bimestres().size());
        assertEquals(1L, mat.bimestres().get(0).id());
        assertEquals(8.5f, mat.bimestres().get(0).mediaCalculada());
        assertEquals(10f, mat.bimestres().get(0).notaFinal());
        assertEquals(10f, mat.bimestres().get(0).nota());
        assertNull(mat.bimestres().get(1).id());
        assertNull(mat.bimestres().get(1).notaFinal());
        assertEquals(6f, mat.bimestres().get(1).nota());
        assertEquals(7f, mat.mediaFinal());
        BoletimDisciplinaDTO port = resultado.get(1);
        assertEquals("Português", port.disciplinaTitle());
        assertEquals(7f, port.mediaFinal());
        verify(studentAccessGuardService).assertCanView(10L, PROFESSOR);
    }

    private Entrega criarEntrega(float pontosObtidos, Bimestre bimestre, Student aluno, Disciplina disciplina) {
        Atividade atividade = new Atividade("Lista", "Exercícios");
        atividade.setBimestre(bimestre);
        atividade.setDisciplina(disciplina);
        atividade.setPontos(2f);
        Entrega entrega = new Entrega(atividade, aluno);
        entrega.setStatus(StatusEntrega.ENTREGUE);
        entrega.setPontosObtidos(pontosObtidos);
        return entrega;
    }

    @Test
    void deveCalcularAMediaDaSalaSoComOsAlunosAtivosDaTurma() {
        Turma turma = new Turma("9º Ano A", "2026");
        ReflectionTestUtils.setField(turma, "id", 1L);
        Disciplina matematica = criarDisciplina(5L, "Matemática");
        Student aluno = criarAluno(10L);
        Student colega = criarAluno(11L);
        Student desligado = criarAluno(12L);
        aluno.setTurma(turma);
        colega.setTurma(turma);
        desligado.setTurma(turma);
        desligado.setStatusMatricula(StatusMatricula.FINALIZADA);
        when(studentRepository.findById(10L)).thenReturn(Optional.of(aluno));
        when(studentRepository.findByTurmaId(1L, Sort.unsorted())).thenReturn(List.of(aluno, colega, desligado));
        when(boletimRepository.findByStudentId(10L))
                .thenReturn(List.of(criarNotaFinal(1L, 8f, Bimestre.PRIMEIRO, aluno, matematica)));
        when(boletimRepository.findByStudentId(11L))
                .thenReturn(List.of(criarNotaFinal(2L, 5f, Bimestre.PRIMEIRO, colega, matematica)));

        List<BoletimDisciplinaDTO> resultado = boletimService.getByStudent(10L, PROFESSOR);

        assertEquals(8f, resultado.get(0).mediaFinal());
        assertEquals(6.5f, resultado.get(0).mediaSala());
    }

    @Test
    void deveSomarOsPontosDasAtividadesANotaDoBimestreLimitandoA10() {
        Student aluno = criarAluno(10L);
        Disciplina matematica = criarDisciplina(5L, "Matemática");
        when(notaRepository.findByStudentIdOrderByIdAsc(10L))
                .thenReturn(List.of(criarNota(6f, Bimestre.SEGUNDO, aluno, matematica)));
        when(boletimRepository.findByStudentId(10L))
                .thenReturn(List.of(criarNotaFinal(1L, 8f, Bimestre.PRIMEIRO, aluno, matematica)));
        Entrega semPontos = new Entrega(new Atividade("Recado", "Sem nota"), aluno);
        when(entregaRepository.findByStudentId(10L)).thenReturn(List.of(
                criarEntrega(1.5f, Bimestre.PRIMEIRO, aluno, matematica),
                criarEntrega(1f, Bimestre.PRIMEIRO, aluno, matematica),
                criarEntrega(0.5f, Bimestre.SEGUNDO, aluno, matematica),
                criarEntrega(2f, Bimestre.TERCEIRO, aluno, matematica),
                semPontos));

        List<BoletimDisciplinaDTO> resultado = boletimService.getByStudent(10L, PROFESSOR);

        List<BoletimDTO> bimestres = resultado.get(0).bimestres();
        assertEquals(3, bimestres.size());
        assertEquals(8f, bimestres.get(0).notaFinal());
        assertEquals(2.5f, bimestres.get(0).pontosAtividades());
        assertEquals(10f, bimestres.get(0).nota());
        assertEquals(0.5f, bimestres.get(1).pontosAtividades());
        assertEquals(6.5f, bimestres.get(1).nota());
        assertNull(bimestres.get(2).notaFinal());
        assertEquals(2f, bimestres.get(2).nota());
    }

    @Test
    void deveLancarANotaFinalComAMediaCalculadaEAvisarOResponsavel() {
        Student aluno = criarAluno(10L);
        Disciplina matematica = criarDisciplina(5L, "Matemática");
        when(studentRepository.findById(10L)).thenReturn(Optional.of(aluno));
        when(disciplinaRepository.findById(5L)).thenReturn(Optional.of(matematica));
        when(userRepository.findByEmail(PROFESSOR)).thenReturn(Optional.of(criarProfessor()));
        when(boletimRepository.findByStudentIdAndDisciplinaIdAndBimestre(10L, 5L, Bimestre.PRIMEIRO)).thenReturn(Optional.empty());
        when(boletimRepository.save(any(Boletim.class))).thenAnswer(invocacao -> {
            Boletim salvo = invocacao.getArgument(0);
            ReflectionTestUtils.setField(salvo, "id", 50L);
            return salvo;
        });
        when(notaRepository.findByStudentIdAndDisciplinaIdAndBimestre(10L, 5L, Bimestre.PRIMEIRO))
                .thenReturn(List.of(criarNota(7f, Bimestre.PRIMEIRO, aluno, matematica), criarNota(8f, Bimestre.PRIMEIRO, aluno, matematica)));

        BoletimDTO resultado = boletimService.lancarNotaFinal(
                new NotaFinalRequestDTO(10L, 5L, Bimestre.PRIMEIRO, 8.5f), PROFESSOR);

        assertEquals(50L, resultado.id());
        assertEquals(8.5f, resultado.notaFinal());
        assertEquals(7.5f, resultado.mediaCalculada());
        assertNotNull(resultado.lancadoEm());
        verify(studentAccessGuardService).assertCanTeach(10L, 5L, PROFESSOR);
        verify(eventPublisher).publishEvent(new NotaFinalLancadaEvent(50L));
    }

    @Test
    void deveAtualizarANotaFinalQuandoJaFoiLancadaNoBimestre() {
        Student aluno = criarAluno(10L);
        Disciplina matematica = criarDisciplina(5L, "Matemática");
        Boletim existente = criarNotaFinal(50L, 6f, Bimestre.PRIMEIRO, aluno, matematica);
        when(studentRepository.findById(10L)).thenReturn(Optional.of(aluno));
        when(disciplinaRepository.findById(5L)).thenReturn(Optional.of(matematica));
        when(userRepository.findByEmail(PROFESSOR)).thenReturn(Optional.of(criarProfessor()));
        when(boletimRepository.findByStudentIdAndDisciplinaIdAndBimestre(10L, 5L, Bimestre.PRIMEIRO)).thenReturn(Optional.of(existente));
        when(boletimRepository.save(existente)).thenReturn(existente);

        BoletimDTO resultado = boletimService.lancarNotaFinal(
                new NotaFinalRequestDTO(10L, 5L, Bimestre.PRIMEIRO, 7f), PROFESSOR);

        assertEquals(50L, resultado.id());
        assertEquals(7f, resultado.notaFinal());
        assertNull(resultado.mediaCalculada());
    }

    @Test
    void deveRecusarNotaFinalForaDoIntervalo() {
        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> boletimService.lancarNotaFinal(new NotaFinalRequestDTO(10L, 5L, Bimestre.PRIMEIRO, 10.5f), PROFESSOR));

        assertEquals("A nota final deve estar entre 0 e 10.", excecao.getMessage());
        verify(studentRepository, never()).findById(anyLong());
        verify(boletimRepository, never()).save(any());
    }

    @Test
    void deveRecusarNotaFinalSemBimestre() {
        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> boletimService.lancarNotaFinal(new NotaFinalRequestDTO(10L, 5L, null, 8f), PROFESSOR));

        assertEquals("Informe o bimestre da nota final.", excecao.getMessage());
        verify(boletimRepository, never()).save(any());
    }

    @Test
    void deveBloquearNotaFinalQuandoProfessorNaoLecionaADisciplina() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(criarAluno(10L)));
        doThrow(new AccessDeniedException("Sem permissão para lançar dados desta disciplina para este aluno."))
                .when(studentAccessGuardService).assertCanTeach(10L, 5L, PROFESSOR);

        AccessDeniedException excecao = assertThrows(AccessDeniedException.class,
                () -> boletimService.lancarNotaFinal(new NotaFinalRequestDTO(10L, 5L, Bimestre.PRIMEIRO, 8f), PROFESSOR));

        assertEquals("Sem permissão para lançar dados desta disciplina para este aluno.", excecao.getMessage());
        verify(boletimRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void deveRemoverANotaFinalECancelarOAvisoAindaNaoEnviado() {
        Boletim boletim = criarNotaFinal(50L, 8f, Bimestre.PRIMEIRO, criarAluno(10L), criarDisciplina(5L, "Matemática"));
        when(boletimRepository.findById(50L)).thenReturn(Optional.of(boletim));

        boletimService.removerNotaFinal(50L, PROFESSOR);

        verify(studentAccessGuardService).assertCanTeach(10L, 5L, PROFESSOR);
        verify(boletimRepository).delete(boletim);
        verify(notificacaoService).cancelarPorReferencia(NotificacaoService.REF_BOLETIM, 50L, "Nota final removida antes do envio");
    }

    @Test
    void deveLancarExcecaoAoRemoverNotaFinalInexistente() {
        when(boletimRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException excecao = assertThrows(ResourceNotFoundException.class,
                () -> boletimService.removerNotaFinal(99L, PROFESSOR));

        assertEquals("Nota final não encontrada com o id: 99", excecao.getMessage());
        verify(boletimRepository, never()).delete(any());
    }
}
