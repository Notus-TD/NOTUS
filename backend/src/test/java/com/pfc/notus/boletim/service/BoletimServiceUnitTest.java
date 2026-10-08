package com.pfc.notus.boletim.service;

import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.domain.SituacaoBoletim;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.notificacao.event.BoletimFechadoEvent;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BoletimServiceUnitTest {

    @Mock
    private BoletimRepository boletimRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private BoletimService boletimService;

    private Student criarAluno(Long id) {
        Student aluno = new Student("Ana Aluna", "ana.aluna@gmail.com", 20260001L, LocalDate.of(2012, 5, 10), null);
        ReflectionTestUtils.setField(aluno, "id", id);
        return aluno;
    }

    private Boletim criarBoletim(Long id, SituacaoBoletim situacao) {
        Boletim boletim = new Boletim("1º Bimestre", 7.5f);
        ReflectionTestUtils.setField(boletim, "id", id);
        boletim.setStudent(criarAluno(10L));
        boletim.setSituacao(situacao);
        if (situacao == SituacaoBoletim.FECHADO) {
            boletim.setFechadoEm(LocalDateTime.of(2026, 6, 30, 18, 0));
        }
        return boletim;
    }

    @Test
    void deveFecharBoletimAbertoRegistrarDataEPublicarEventoDeNotificacao() {
        // Arrange
        Boletim boletim = criarBoletim(1L, SituacaoBoletim.ABERTO);
        when(boletimRepository.findById(1L)).thenReturn(Optional.of(boletim));
        when(boletimRepository.save(boletim)).thenReturn(boletim);
        LocalDateTime antes = LocalDateTime.now().minusSeconds(1);

        // Act
        BoletimDTO resultado = boletimService.fechar(1L);

        // Assert
        assertEquals(SituacaoBoletim.FECHADO, resultado.situacao());
        assertNotNull(resultado.fechadoEm());
        assertTrue(!resultado.fechadoEm().isBefore(antes), "a data de fechamento deve ser a do momento do fechamento");
        assertEquals(0, resultado.fechadoEm().getNano(), "a data de fechamento é gravada sem frações de segundo");
        ArgumentCaptor<BoletimFechadoEvent> evento = ArgumentCaptor.forClass(BoletimFechadoEvent.class);
        verify(eventPublisher).publishEvent(evento.capture());
        assertEquals(1L, evento.getValue().boletimId());
    }

    @Test
    void deveLancarConflitoSemSalvarNemNotificarQuandoBoletimJaEstaFechado() {
        // Arrange
        Boletim boletim = criarBoletim(1L, SituacaoBoletim.FECHADO);
        when(boletimRepository.findById(1L)).thenReturn(Optional.of(boletim));

        // Act
        ConflictException excecao = assertThrows(ConflictException.class, () -> boletimService.fechar(1L));

        // Assert
        assertEquals("Boletim já está fechado", excecao.getMessage());
        verify(boletimRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void deveLancarExcecaoQuandoBoletimAFecharNaoExiste() {
        // Arrange
        when(boletimRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        ResourceNotFoundException excecao = assertThrows(ResourceNotFoundException.class,
                () -> boletimService.fechar(99L));

        // Assert
        assertEquals("Boletim não encontrado com o id: 99", excecao.getMessage());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void deveReabrirBoletimFechadoLimparDataDeFechamentoSemNotificar() {
        // Arrange
        Boletim boletim = criarBoletim(1L, SituacaoBoletim.FECHADO);
        when(boletimRepository.findById(1L)).thenReturn(Optional.of(boletim));
        when(boletimRepository.save(boletim)).thenReturn(boletim);

        // Act
        BoletimDTO resultado = boletimService.reabrir(1L);

        // Assert
        assertEquals(SituacaoBoletim.ABERTO, resultado.situacao());
        assertNull(resultado.fechadoEm());
        assertEquals(7.5f, resultado.finalAverage(), "reabrir não pode mexer na média já calculada");
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void deveLancarConflitoAoReabrirBoletimQueJaEstaAberto() {
        // Arrange
        Boletim boletim = criarBoletim(1L, SituacaoBoletim.ABERTO);
        when(boletimRepository.findById(1L)).thenReturn(Optional.of(boletim));

        // Act
        ConflictException excecao = assertThrows(ConflictException.class, () -> boletimService.reabrir(1L));

        // Assert
        assertEquals("Boletim já está aberto", excecao.getMessage());
        verify(boletimRepository, never()).save(any());
    }

    @Test
    void deveCriarBoletimAbertoComMediaZeroMesmoQueOPedidoInformeOutraMedia() {
        // Arrange
        Student aluno = criarAluno(10L);
        BoletimDTO pedido = new BoletimDTO(null, "2º Bimestre", 9.9f, "EM ANDAMENTO", 10L, SituacaoBoletim.FECHADO, null);
        when(studentRepository.findById(10L)).thenReturn(Optional.of(aluno));
        when(boletimRepository.save(any(Boletim.class))).thenAnswer(invocacao -> {
            Boletim salvo = invocacao.getArgument(0);
            ReflectionTestUtils.setField(salvo, "id", 7L);
            return salvo;
        });

        // Act
        BoletimDTO resultado = boletimService.save(pedido);

        // Assert
        assertEquals(7L, resultado.id());
        assertEquals(0f, resultado.finalAverage(), "a média começa em zero e só muda quando notas são lançadas");
        assertEquals(SituacaoBoletim.ABERTO, resultado.situacao(), "todo boletim novo nasce aberto");
        assertNull(resultado.fechadoEm());
        assertEquals(10L, resultado.studentId());
    }

    @Test
    void deveLancarExcecaoSemSalvarQuandoAlunoDoBoletimNaoExiste() {
        // Arrange
        BoletimDTO pedido = new BoletimDTO(null, "2º Bimestre", 0f, "EM ANDAMENTO", 99L, null, null);
        when(studentRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        EntityNotFoundException excecao = assertThrows(EntityNotFoundException.class,
                () -> boletimService.save(pedido));

        // Assert
        assertEquals("Aluno não encontrado com o id: 99", excecao.getMessage());
        verify(boletimRepository, never()).save(any());
    }
}
