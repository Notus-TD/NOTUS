package com.pfc.notus.falta.service;

import com.pfc.notus.calendario.service.CalendarioService;
import com.pfc.notus.disciplina.domain.AulaRegistro;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.AulaRegistroRepository;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.falta.domain.FaltaDomain;
import com.pfc.notus.falta.dto.ChamadaDTO;
import com.pfc.notus.falta.dto.ChamadaFaltaRequestDTO;
import com.pfc.notus.falta.dto.ChamadaRequestDTO;
import com.pfc.notus.falta.repository.FaltaRepository;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import com.pfc.notus.notificacao.event.FaltaRegistradaEvent;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.repository.TurmaRepository;
import com.pfc.notus.user.domain.Professor;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FaltaServiceUnitTest {

    private static final String PROFESSOR = "pedro.professor@gmail.com";
    private static final LocalDate HOJE = LocalDate.now();

    @Mock
    private FaltaRepository faltaRepository;

    @Mock
    private CalendarioService calendarioService;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private DisiciplinaRepository disciplinaRepository;

    @Mock
    private TurmaRepository turmaRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AulaRegistroRepository aulaRegistroRepository;

    @Mock
    private StudentAccessGuardService studentAccessGuardService;

    @Mock
    private LecionamentoRepository lecionamentoRepository;

    @Mock
    private NotificacaoService notificacaoService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private FaltaService faltaService;

    private Turma criarTurma() {
        Turma turma = new Turma("9º Ano A", "2026");
        ReflectionTestUtils.setField(turma, "id", 1L);
        return turma;
    }

    private Disciplina criarDisciplina() {
        Disciplina matematica = new Disciplina("Matemática", "Matemática");
        ReflectionTestUtils.setField(matematica, "id", 5L);
        return matematica;
    }

    private Student criarAluno(Long id, String nome, Turma turma) {
        Student aluno = new Student(nome, nome.toLowerCase().replace(" ", ".") + "@gmail.com", 20260000L + id, LocalDate.of(2012, 5, 10), null);
        ReflectionTestUtils.setField(aluno, "id", id);
        aluno.setTurma(turma);
        return aluno;
    }

    private Professor criarProfessor() {
        Professor professor = new Professor("Pedro Professor", PROFESSOR);
        ReflectionTestUtils.setField(professor, "id", 2L);
        return professor;
    }

    private FaltaDomain criarFalta(Long id, int quantidade, Student aluno, Disciplina disciplina) {
        FaltaDomain falta = new FaltaDomain(quantidade, HOJE, LocalDateTime.now(), aluno, criarProfessor(), disciplina);
        ReflectionTestUtils.setField(falta, "id", id);
        return falta;
    }

    private ChamadaRequestDTO chamada(int aulas, ChamadaFaltaRequestDTO... faltas) {
        return new ChamadaRequestDTO(1L, 5L, HOJE, aulas, List.of(faltas));
    }

    private void prepararTurma(Turma turma, Disciplina disciplina, Student... alunos) {
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(turma));
        when(disciplinaRepository.findById(5L)).thenReturn(Optional.of(disciplina));
        when(userRepository.findByEmail(PROFESSOR)).thenReturn(Optional.of(criarProfessor()));
        when(studentRepository.findByTurmaId(1L, Sort.by("fullName"))).thenReturn(List.of(alunos));
    }

    @Test
    void deveSalvarAChamadaComAulaDuplaEAvisarSoQuemFaltou() {
        Turma turma = criarTurma();
        Disciplina matematica = criarDisciplina();
        Student ana = criarAluno(10L, "Ana Aluna", turma);
        Student bruno = criarAluno(11L, "Bruno Ferreira", turma);
        prepararTurma(turma, matematica, ana, bruno);
        when(faltaRepository.save(any(FaltaDomain.class))).thenAnswer(invocacao -> {
            FaltaDomain salva = invocacao.getArgument(0);
            ReflectionTestUtils.setField(salva, "id", 100L);
            return salva;
        });
        when(faltaRepository.findByAlunoIdInAndDisciplinaIdAndAnoLetivo(anyCollection(), eq(5L), eq("2026")))
                .thenReturn(List.of(criarFalta(100L, 2, ana, matematica)));

        ChamadaDTO resultado = faltaService.salvarChamada(
                chamada(2, new ChamadaFaltaRequestDTO(10L, 2), new ChamadaFaltaRequestDTO(11L, 0)), PROFESSOR);

        ArgumentCaptor<AulaRegistro> aula = ArgumentCaptor.forClass(AulaRegistro.class);
        verify(aulaRegistroRepository).save(aula.capture());
        assertEquals(2, aula.getValue().getQuantidadeAulas());
        assertEquals(1L, aula.getValue().getTurma().getId());
        ArgumentCaptor<FaltaDomain> falta = ArgumentCaptor.forClass(FaltaDomain.class);
        verify(faltaRepository).save(falta.capture());
        assertEquals(2, falta.getValue().getQuantidade());
        assertEquals(10L, falta.getValue().getAluno().getId());
        verify(eventPublisher).publishEvent(new FaltaRegistradaEvent(100L, 2));
        assertEquals(2, resultado.alunos().size());
        verify(studentAccessGuardService).assertCanTeachTurma(1L, 5L, PROFESSOR);
    }

    @Test
    void deveAtualizarAFaltaDoDiaSemCriarOutraNemAvisarDeNovo() {
        Turma turma = criarTurma();
        Disciplina matematica = criarDisciplina();
        Student ana = criarAluno(10L, "Ana Aluna", turma);
        FaltaDomain existente = criarFalta(100L, 1, ana, matematica);
        prepararTurma(turma, matematica, ana);
        when(faltaRepository.findByAlunoIdInAndDisciplinaIdAndData(anyCollection(), eq(5L), eq(HOJE)))
                .thenReturn(List.of(existente));

        faltaService.salvarChamada(chamada(2, new ChamadaFaltaRequestDTO(10L, 2)), PROFESSOR);

        assertEquals(2, existente.getQuantidade());
        verify(faltaRepository).save(existente);
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void deveApagarAFaltaQuandoAChamadaZeraOAluno() {
        Turma turma = criarTurma();
        Disciplina matematica = criarDisciplina();
        Student ana = criarAluno(10L, "Ana Aluna", turma);
        FaltaDomain existente = criarFalta(100L, 1, ana, matematica);
        prepararTurma(turma, matematica, ana);
        when(faltaRepository.findByAlunoIdInAndDisciplinaIdAndData(anyCollection(), eq(5L), eq(HOJE)))
                .thenReturn(List.of(existente));

        faltaService.salvarChamada(chamada(1, new ChamadaFaltaRequestDTO(10L, 0)), PROFESSOR);

        verify(faltaRepository).delete(existente);
        verify(notificacaoService).cancelarPorReferencia(NotificacaoService.REF_FALTA, 100L, "Falta removida na chamada");
    }

    @Test
    void deveRecusarMaisFaltasDoQueAulasNoDia() {
        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> faltaService.salvarChamada(chamada(1, new ChamadaFaltaRequestDTO(10L, 2)), PROFESSOR));

        assertEquals("O aluno pode ter no máximo 1 falta(s) nesta chamada.", excecao.getMessage());
        verify(studentAccessGuardService, never()).assertCanTeachTurma(anyLong(), anyLong(), anyString());
        verify(faltaRepository, never()).save(any());
    }

    @Test
    void deveRecusarMaisDeDuasAulasNoDia() {
        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> faltaService.salvarChamada(chamada(3, new ChamadaFaltaRequestDTO(10L, 3)), PROFESSOR));

        assertEquals("A chamada deve ter 1 ou 2 aulas no dia.", excecao.getMessage());
        verify(aulaRegistroRepository, never()).save(any());
    }

    @Test
    void deveRecusarChamadaEmDataFutura() {
        ChamadaRequestDTO futura = new ChamadaRequestDTO(1L, 5L, HOJE.plusDays(1), 1, List.of());

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> faltaService.salvarChamada(futura, PROFESSOR));

        assertEquals("Não é possível lançar chamada em data futura.", excecao.getMessage());
    }

    @Test
    void deveRecusarAlunoRepetidoNaChamada() {
        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> faltaService.salvarChamada(
                        chamada(2, new ChamadaFaltaRequestDTO(10L, 1), new ChamadaFaltaRequestDTO(10L, 2)), PROFESSOR));

        assertEquals("Aluno repetido na chamada: 10", excecao.getMessage());
    }

    @Test
    void deveRecusarAlunoQueNaoEstaNaTurma() {
        Turma turma = criarTurma();
        prepararTurma(turma, criarDisciplina(), criarAluno(10L, "Ana Aluna", turma));

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> faltaService.salvarChamada(chamada(1, new ChamadaFaltaRequestDTO(99L, 1)), PROFESSOR));

        assertEquals("O aluno não pertence a esta turma: 99", excecao.getMessage());
        verify(aulaRegistroRepository, never()).save(any());
    }

    @Test
    void deveBloquearProfessorQueNaoLecionaNaTurma() {
        doThrow(new AccessDeniedException("Sem permissão para esta disciplina nesta turma."))
                .when(studentAccessGuardService).assertCanTeachTurma(1L, 5L, PROFESSOR);

        AccessDeniedException excecao = assertThrows(AccessDeniedException.class,
                () -> faltaService.salvarChamada(chamada(1, new ChamadaFaltaRequestDTO(10L, 1)), PROFESSOR));

        assertEquals("Sem permissão para esta disciplina nesta turma.", excecao.getMessage());
        verify(aulaRegistroRepository, never()).save(any());
        verify(faltaRepository, never()).save(any());
    }

    @Test
    void deveMontarAChamadaComAsFaltasDoDiaEOTotalDeCadaAluno() {
        Turma turma = criarTurma();
        Disciplina matematica = criarDisciplina();
        Student ana = criarAluno(10L, "Ana Aluna", turma);
        Student bruno = criarAluno(11L, "Bruno Ferreira", turma);
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(turma));
        when(studentRepository.findByTurmaId(1L, Sort.by("fullName"))).thenReturn(List.of(ana, bruno));
        when(aulaRegistroRepository.findByTurmaIdAndDisciplinaIdAndDataAndAnoLetivo(1L, 5L, HOJE, "2026")).thenReturn(Optional.empty());
        when(faltaRepository.findByAlunoIdInAndDisciplinaIdAndData(List.of(10L, 11L), 5L, HOJE))
                .thenReturn(List.of(criarFalta(1L, 2, ana, matematica)));
        when(faltaRepository.findByAlunoIdInAndDisciplinaIdAndAnoLetivo(List.of(10L, 11L), 5L, "2026"))
                .thenReturn(List.of(criarFalta(1L, 2, ana, matematica), criarFalta(2L, 1, ana, matematica),
                        criarFalta(3L, 1, bruno, matematica)));

        ChamadaDTO resultado = faltaService.getChamada(1L, 5L, HOJE, PROFESSOR);

        assertNull(resultado.aulas());
        assertEquals(2, resultado.alunos().get(0).faltasNoDia());
        assertEquals(3, resultado.alunos().get(0).totalFaltas());
        assertEquals(0, resultado.alunos().get(1).faltasNoDia());
        assertEquals(1, resultado.alunos().get(1).totalFaltas());
    }

    @Test
    void naoDeveSalvarChamadaEmBimestreFechado() {
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(criarTurma()));
        doThrow(new RegraNegocioException("O 3º bimestre está fechado. Peça à secretaria para reabrir."))
                .when(calendarioService).exigirDataLetiva("2026", HOJE);

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> faltaService.salvarChamada(chamada(1), PROFESSOR));

        assertEquals("O 3º bimestre está fechado. Peça à secretaria para reabrir.", erro.getMessage());
        verify(aulaRegistroRepository, never()).save(any());
    }
}
