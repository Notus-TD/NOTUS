package com.pfc.notus.nota.service;

import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.repository.NotaRepository;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.service.StudentAccessGuardService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotaServiceUnitTest {

    private static final String PROFESSOR = "pedro.professor@gmail.com";

    @Mock
    private NotaRepository notaRepository;

    @Mock
    private BoletimRepository boletimRepository;

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

    private Boletim criarBoletim(Long id, Student aluno) {
        Boletim boletim = new Boletim("1º Bimestre", 0f);
        ReflectionTestUtils.setField(boletim, "id", id);
        boletim.setStudent(aluno);
        return boletim;
    }

    private Disciplina criarDisciplina(Long id, String titulo) {
        Disciplina disciplina = new Disciplina(titulo, titulo);
        ReflectionTestUtils.setField(disciplina, "id", id);
        return disciplina;
    }

    private Nota criarNota(Long id, float valor, Boletim boletim, Disciplina disciplina) {
        Nota nota = new Nota(valor, "Prova");
        ReflectionTestUtils.setField(nota, "id", id);
        nota.setBoletim(boletim);
        nota.setDisciplina(disciplina);
        return nota;
    }

    @Test
    void deveLancarNotaERecalcularMediaDoBoletimQuandoProfessorTemPermissao() {
        // Arrange
        Boletim boletim = criarBoletim(1L, criarAluno(10L));
        Disciplina matematica = criarDisciplina(5L, "Matemática");
        NotaDTO pedido = new NotaDTO(null, 8.5f, "Prova bimestral", 1L, 5L);

        when(boletimRepository.findById(1L)).thenReturn(Optional.of(boletim));
        when(disciplinaRepository.findById(5L)).thenReturn(Optional.of(matematica));
        when(notaRepository.save(any(Nota.class))).thenAnswer(invocacao -> {
            Nota salva = invocacao.getArgument(0);
            ReflectionTestUtils.setField(salva, "id", 100L);
            return salva;
        });
        when(notaRepository.findByBoletimId(1L))
                .thenReturn(List.of(criarNota(100L, 8.5f, boletim, matematica)));

        // Act
        NotaDTO resultado = notaService.save(pedido, PROFESSOR);

        // Assert
        assertEquals(100L, resultado.id());
        assertEquals(8.5f, resultado.rate());
        assertEquals("Prova bimestral", resultado.period());
        assertEquals(1L, resultado.boletimId());
        assertEquals(5L, resultado.disciplinaId());
        assertEquals(8.5f, boletim.getFinalAverage());
        verify(studentAccessGuardService).assertCanTeach(10L, 5L, PROFESSOR);
        verify(boletimRepository).save(boletim);
    }

    @Test
    void deveLancarExcecaoESemSalvarNotaQuandoBoletimNaoExiste() {
        // Arrange
        NotaDTO pedido = new NotaDTO(null, 7f, "Prova", 99L, 5L);
        when(boletimRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        EntityNotFoundException excecao = assertThrows(EntityNotFoundException.class,
                () -> notaService.save(pedido, PROFESSOR));

        // Assert
        assertEquals("Boletim não encontrado com o id: 99", excecao.getMessage());
        verify(studentAccessGuardService, never()).assertCanTeach(anyLong(), anyLong(), anyString());
        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveBloquearLancamentoQuandoProfessorNaoLecionaADisciplinaDoAluno() {
        // Arrange
        Boletim boletim = criarBoletim(1L, criarAluno(10L));
        NotaDTO pedido = new NotaDTO(null, 9f, "Prova", 1L, 5L);
        when(boletimRepository.findById(1L)).thenReturn(Optional.of(boletim));
        doThrow(new AccessDeniedException("Sem permissão para lançar dados desta disciplina para este aluno."))
                .when(studentAccessGuardService).assertCanTeach(10L, 5L, PROFESSOR);

        // Act
        AccessDeniedException excecao = assertThrows(AccessDeniedException.class,
                () -> notaService.save(pedido, PROFESSOR));

        // Assert
        assertEquals("Sem permissão para lançar dados desta disciplina para este aluno.", excecao.getMessage());
        verify(notaRepository, never()).save(any());
        verify(boletimRepository, never()).save(any());
    }

    /**
     * A média do boletim é a média das médias de cada matéria: lançar mais notas
     * em uma matéria não pode fazer ela pesar mais que as outras.
     * Cenário: uma nota é apagada e a média é recalculada com as notas que sobram.
     * Formato das notas que sobram: "idDisciplina:valor" separados por ";".
     */
    @ParameterizedTest(name = "notas [{0}] devem gerar média {1}")
    @CsvSource({
            "1:10,                  10.0",
            "1:10;2:6,              8.0",
            "1:10;1:10;1:10;2:4,    7.0",
            "1:0;2:0,               0.0",
            "1:5.5;2:6.5;3:7,       6.333333"
    })
    void deveCalcularMediaDoBoletimComoMediaDasMediasPorDisciplina(String notas, float mediaEsperada) {
        // Arrange
        Boletim boletim = criarBoletim(1L, criarAluno(10L));
        List<Nota> notasDoBoletim = new ArrayList<>();
        long idNota = 1;
        for (String item : notas.split(";")) {
            String[] partes = item.split(":");
            Disciplina disciplina = criarDisciplina(Long.parseLong(partes[0]), "Disciplina " + partes[0]);
            notasDoBoletim.add(criarNota(idNota++, Float.parseFloat(partes[1]), boletim, disciplina));
        }
        Nota notaApagada = criarNota(500L, 1f, boletim, criarDisciplina(1L, "Disciplina 1"));

        when(notaRepository.findById(500L)).thenReturn(Optional.of(notaApagada));
        when(boletimRepository.findById(1L)).thenReturn(Optional.of(boletim));
        when(notaRepository.findByBoletimId(1L)).thenReturn(notasDoBoletim);

        // Act
        notaService.delete(500L, PROFESSOR);

        // Assert
        assertEquals(mediaEsperada, boletim.getFinalAverage(), 0.0001f);
    }

    @ParameterizedTest(name = "nota {0} deve ser recusada")
    @NullSource
    @ValueSource(floats = {-0.1f, 10.1f, -5f, 15f, Float.NaN})
    void deveRecusarLancamentoQuandoNotaEstaForaDoIntervaloDeZeroADez(Float valorInvalido) {
        // Arrange
        NotaDTO pedido = new NotaDTO(null, valorInvalido, "Prova", 1L, 5L);

        // Act
        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> notaService.save(pedido, PROFESSOR));

        // Assert
        assertEquals("A nota deve estar entre 0 e 10.", excecao.getMessage());
        verify(boletimRepository, never()).findById(anyLong());
        verify(notaRepository, never()).save(any());
    }

    @ParameterizedTest(name = "nota {0} deve ser aceita")
    @ValueSource(floats = {0f, 10f})
    void deveAceitarNotaExatamenteNosLimitesDeZeroEDez(float valorNoLimite) {
        // Arrange
        Boletim boletim = criarBoletim(1L, criarAluno(10L));
        Disciplina matematica = criarDisciplina(5L, "Matemática");
        NotaDTO pedido = new NotaDTO(null, valorNoLimite, "Prova", 1L, 5L);

        when(boletimRepository.findById(1L)).thenReturn(Optional.of(boletim));
        when(disciplinaRepository.findById(5L)).thenReturn(Optional.of(matematica));
        when(notaRepository.save(any(Nota.class))).thenAnswer(invocacao -> invocacao.getArgument(0));
        when(notaRepository.findByBoletimId(1L))
                .thenReturn(List.of(criarNota(1L, valorNoLimite, boletim, matematica)));

        // Act
        NotaDTO resultado = notaService.save(pedido, PROFESSOR);

        // Assert
        assertEquals(valorNoLimite, resultado.rate());
        assertEquals(valorNoLimite, boletim.getFinalAverage());
        verify(notaRepository).save(any(Nota.class));
    }

    @Test
    void deveRecusarEdicaoSemConsultarANotaQuandoNovoValorPassaDeDez() {
        // Arrange
        NotaDTO alteracao = new NotaDTO(50L, 11f, "Prova", 1L, 5L);

        // Act
        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> notaService.update(50L, alteracao, PROFESSOR));

        // Assert
        assertEquals("A nota deve estar entre 0 e 10.", excecao.getMessage());
        verify(notaRepository, never()).findById(anyLong());
        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveZerarMediaDoBoletimQuandoUltimaNotaForApagada() {
        // Arrange
        Boletim boletim = criarBoletim(1L, criarAluno(10L));
        boletim.setFinalAverage(9f);
        Nota unicaNota = criarNota(50L, 9f, boletim, criarDisciplina(5L, "Matemática"));

        when(notaRepository.findById(50L)).thenReturn(Optional.of(unicaNota));
        when(boletimRepository.findById(1L)).thenReturn(Optional.of(boletim));
        when(notaRepository.findByBoletimId(1L)).thenReturn(List.of());

        // Act
        notaService.delete(50L, PROFESSOR);

        // Assert
        assertEquals(0f, boletim.getFinalAverage());
        verify(notaRepository).deleteById(50L);
        verify(boletimRepository).save(boletim);
    }

    @Test
    void deveRecalcularMediaDosDoisBoletinsQuandoNotaForMovidaDeBoletim() {
        // Arrange
        Student aluno = criarAluno(10L);
        Boletim boletimAntigo = criarBoletim(1L, aluno);
        Boletim boletimNovo = criarBoletim(2L, aluno);
        Disciplina matematica = criarDisciplina(5L, "Matemática");
        Nota nota = criarNota(50L, 6f, boletimAntigo, matematica);
        NotaDTO alteracao = new NotaDTO(50L, 8f, "Prova", 2L, 5L);

        when(notaRepository.findById(50L)).thenReturn(Optional.of(nota));
        when(boletimRepository.findById(1L)).thenReturn(Optional.of(boletimAntigo));
        when(boletimRepository.findById(2L)).thenReturn(Optional.of(boletimNovo));
        when(disciplinaRepository.findById(5L)).thenReturn(Optional.of(matematica));
        when(notaRepository.save(nota)).thenReturn(nota);
        when(notaRepository.findByBoletimId(2L)).thenReturn(List.of(nota));
        when(notaRepository.findByBoletimId(1L)).thenReturn(List.of());

        // Act
        NotaDTO resultado = notaService.update(50L, alteracao, PROFESSOR);

        // Assert
        assertEquals(2L, resultado.boletimId());
        assertEquals(8f, boletimNovo.getFinalAverage());
        assertEquals(0f, boletimAntigo.getFinalAverage());
        verify(boletimRepository).save(boletimNovo);
        verify(boletimRepository).save(boletimAntigo);
        verify(studentAccessGuardService, times(2)).assertCanTeach(10L, 5L, PROFESSOR);
    }
}
