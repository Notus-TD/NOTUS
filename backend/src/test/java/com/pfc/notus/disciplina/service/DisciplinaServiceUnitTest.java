package com.pfc.notus.disciplina.service;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

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

    @Mock
    private DisiciplinaRepository disciplinaRepository;

    @Mock
    private LecionamentoRepository lecionamentoRepository;

    @InjectMocks
    private DisciplinaService disciplinaService;

    private Disciplina disciplina(Long id) {
        Disciplina disciplina = new Disciplina("Matemática", "Matemática");
        ReflectionTestUtils.setField(disciplina, "id", id);
        return disciplina;
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
