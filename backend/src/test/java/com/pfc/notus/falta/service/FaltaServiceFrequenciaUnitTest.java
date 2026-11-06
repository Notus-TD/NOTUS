package com.pfc.notus.falta.service;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.AulaRegistroRepository;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.falta.domain.FaltaDomain;
import com.pfc.notus.falta.dto.FrequenciaDisciplinaDTO;
import com.pfc.notus.falta.repository.FaltaRepository;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** RF06: o percentual de presença conta só as aulas da turma do aluno. */
@ExtendWith(MockitoExtension.class)
class FaltaServiceFrequenciaUnitTest {

    private static final String ALUNO = "ana.aluna@gmail.com";

    @Mock
    private FaltaRepository faltaRepository;

    @Mock
    private DisiciplinaRepository disciplinaRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AulaRegistroRepository aulaRegistroRepository;

    @InjectMocks
    private FaltaService faltaService;

    private Disciplina disciplina(Long id, String titulo) {
        Disciplina disciplina = new Disciplina(titulo, titulo);
        ReflectionTestUtils.setField(disciplina, "id", id);
        return disciplina;
    }

    private Student alunoNaTurma(Long turmaId) {
        Turma turma = new Turma("9º Ano A", "2026");
        ReflectionTestUtils.setField(turma, "id", turmaId);
        Student aluno = new Student("Ana Aluna", ALUNO, 20260001L, LocalDate.of(2012, 5, 10), null);
        ReflectionTestUtils.setField(aluno, "id", 2026000001L);
        aluno.setTurma(turma);
        return aluno;
    }

    @Test
    void frequencia_deveContarSoAsAulasDaTurmaDoAluno() {
        Student aluno = alunoNaTurma(1L);
        Disciplina matematica = disciplina(1L, "Matemática");
        Disciplina ingles = disciplina(2L, "Inglês");
        when(userRepository.findByEmail(ALUNO)).thenReturn(Optional.of(aluno));
        when(disciplinaRepository.findAll()).thenReturn(List.of(matematica, ingles));
        when(faltaRepository.findByAlunoId(aluno.getId())).thenReturn(List.of(
                new FaltaDomain(1, LocalDate.of(2026, 3, 2), LocalDateTime.now(), aluno, null, matematica),
                new FaltaDomain(1, LocalDate.of(2026, 3, 9), LocalDateTime.now(), aluno, null, matematica),
                // Falta de uma turma anterior (data sem aula na turma atual): não conta.
                new FaltaDomain(1, LocalDate.of(2025, 9, 1), LocalDateTime.now(), aluno, null, matematica)));
        Set<LocalDate> dezAulas = new HashSet<>();
        for (int dia = 2; dia <= 11; dia++) dezAulas.add(LocalDate.of(2026, 3, dia));
        when(aulaRegistroRepository.findDatasByTurmaIdAndDisciplinaId(1L, 1L)).thenReturn(dezAulas);
        // Inglês só tem aulas em outra turma: para a turma 1 não há aula.
        when(aulaRegistroRepository.findDatasByTurmaIdAndDisciplinaId(1L, 2L)).thenReturn(Set.of());

        List<FrequenciaDisciplinaDTO> frequencia = faltaService.getFrequenciaParaUsuarioLogado(ALUNO);

        assertThat(frequencia).hasSize(1);
        assertThat(frequencia.get(0).disciplinaId()).isEqualTo(1L);
        assertThat(frequencia.get(0).totalAulas()).isEqualTo(10L);
        assertThat(frequencia.get(0).percentualPresenca()).isEqualTo(80.0);
        assertThat(frequencia.get(0).totalFaltas()).isEqualTo(2L);
        verify(aulaRegistroRepository, never()).findDatasByTurmaIdAndDisciplinaId(eq(2L), anyLong());
    }

    @Test
    void frequencia_alunoSemTurmaNaoTemPercentual() {
        Student aluno = alunoNaTurma(1L);
        aluno.setTurma(null);
        when(userRepository.findByEmail(ALUNO)).thenReturn(Optional.of(aluno));
        when(disciplinaRepository.findAll()).thenReturn(List.of(disciplina(1L, "Matemática")));

        assertThat(faltaService.getFrequenciaParaUsuarioLogado(ALUNO)).isEmpty();
    }
}
