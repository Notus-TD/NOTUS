package com.pfc.notus.disciplina.service;

import com.pfc.notus.disciplina.domain.AulaRegistro;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.AulaRegistroRepository;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.repository.TurmaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DisciplinaServiceUnitTest {

    private static final LocalDate DIA = LocalDate.of(2026, 11, 3);

    @Mock
    private DisiciplinaRepository disciplinaRepository;

    @Mock
    private AulaRegistroRepository aulaRegistroRepository;

    @Mock
    private TurmaRepository turmaRepository;

    @Mock
    private LecionamentoRepository lecionamentoRepository;

    @InjectMocks
    private DisciplinaService disciplinaService;

    private Turma turma(Long id) {
        Turma turma = new Turma("8º Ano A", "2026");
        ReflectionTestUtils.setField(turma, "id", id);
        return turma;
    }

    private Disciplina disciplina(Long id) {
        Disciplina disciplina = new Disciplina("Matemática", "Matemática");
        ReflectionTestUtils.setField(disciplina, "id", id);
        return disciplina;
    }

    @Test
    void registrarAula_deveGuardarATurmaDaAula() {
        when(disciplinaRepository.findById(1L)).thenReturn(Optional.of(disciplina(1L)));
        when(turmaRepository.findById(7L)).thenReturn(Optional.of(turma(7L)));
        when(lecionamentoRepository.existsByTurmaIdAndDisciplinaId(7L, 1L)).thenReturn(true);
        when(aulaRegistroRepository.existsByTurmaIdAndDisciplinaIdAndData(7L, 1L, DIA)).thenReturn(false);

        disciplinaService.registrarAula(1L, 7L, DIA);

        ArgumentCaptor<AulaRegistro> captor = ArgumentCaptor.forClass(AulaRegistro.class);
        verify(aulaRegistroRepository).save(captor.capture());
        assertThat(captor.getValue().getTurma().getId()).isEqualTo(7L);
        assertThat(captor.getValue().getDisciplina().getId()).isEqualTo(1L);
        assertThat(captor.getValue().getData()).isEqualTo(DIA);
    }

    @Test
    void registrarAula_naoDeveContarSegundaAulaNaMesmaTurmaEData() {
        when(disciplinaRepository.findById(1L)).thenReturn(Optional.of(disciplina(1L)));
        when(turmaRepository.findById(7L)).thenReturn(Optional.of(turma(7L)));
        when(lecionamentoRepository.existsByTurmaIdAndDisciplinaId(7L, 1L)).thenReturn(true);
        when(aulaRegistroRepository.existsByTurmaIdAndDisciplinaIdAndData(7L, 1L, DIA)).thenReturn(true);

        disciplinaService.registrarAula(1L, 7L, DIA);

        verify(aulaRegistroRepository, never()).save(any());
    }

    @Test
    void registrarAula_deveRecusarDisciplinaQueNaoELecionadaNaTurma() {
        when(disciplinaRepository.findById(1L)).thenReturn(Optional.of(disciplina(1L)));
        when(turmaRepository.findById(7L)).thenReturn(Optional.of(turma(7L)));
        when(lecionamentoRepository.existsByTurmaIdAndDisciplinaId(7L, 1L)).thenReturn(false);

        assertThatThrownBy(() -> disciplinaService.registrarAula(1L, 7L, DIA))
                .isInstanceOf(RegraNegocioException.class);
        verify(aulaRegistroRepository, never()).save(any());
    }

    @Test
    void excluir_deveRecusarDisciplinaComProfessoresVinculados() {
        when(disciplinaRepository.existsById(1L)).thenReturn(true);
        when(lecionamentoRepository.existsByDisciplinaId(1L)).thenReturn(true);

        assertThatThrownBy(() -> disciplinaService.delete(1L))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("professores vinculados");
        verify(disciplinaRepository, never()).deleteById(any());
    }

    @Test
    void excluir_deveVirarConflitoQuandoHaNotasOuFaltas() {
        when(disciplinaRepository.existsById(1L)).thenReturn(true);
        when(lecionamentoRepository.existsByDisciplinaId(1L)).thenReturn(false);
        doThrow(new DataIntegrityViolationException("fk")).when(disciplinaRepository).flush();

        assertThatThrownBy(() -> disciplinaService.delete(1L))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("não pode ser excluída");
    }

    @Test
    void excluir_disciplinaInexistenteDeveSer404() {
        when(disciplinaRepository.existsById(9L)).thenReturn(false);

        assertThatThrownBy(() -> disciplinaService.delete(9L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
