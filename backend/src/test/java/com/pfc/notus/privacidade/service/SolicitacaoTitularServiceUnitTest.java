package com.pfc.notus.privacidade.service;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.privacidade.domain.SolicitacaoTitular;
import com.pfc.notus.privacidade.domain.StatusSolicitacao;
import com.pfc.notus.privacidade.domain.TipoSolicitacao;
import com.pfc.notus.privacidade.dto.RespostaSolicitacaoRequest;
import com.pfc.notus.privacidade.dto.SolicitacaoDTO;
import com.pfc.notus.privacidade.dto.SolicitacaoRequest;
import com.pfc.notus.privacidade.repository.SolicitacaoTitularRepository;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.ResponsibleRepository;
import com.pfc.notus.user.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SolicitacaoTitularServiceUnitTest {

    @Mock
    private SolicitacaoTitularRepository solicitacaoRepository;

    @Mock
    private ResponsibleRepository responsibleRepository;

    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private SolicitacaoTitularService service;

    private Responsible marta;
    private Student ana;

    @BeforeEach
    void setUp() {
        marta = new Responsible("Marta Souza", "marta@notus.com", "11999999999");
        marta.setId(10L);
        ana = new Student("Ana Souza", "ana@notus.com", 1L, LocalDate.of(2013, 3, 1), marta);
        ana.setId(20L);
    }

    @Test
    void solicitar_registraPedidoComPrazoDeQuinzeDias() {
        when(responsibleRepository.findByEmail("marta@notus.com")).thenReturn(Optional.of(marta));
        when(studentRepository.findById(20L)).thenReturn(Optional.of(ana));
        when(solicitacaoRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        SolicitacaoDTO dto = service.solicitar(
                new SolicitacaoRequest(TipoSolicitacao.ANONIMIZACAO, 20L, "  Mudança de escola  "), "marta@notus.com");

        assertEquals(StatusSolicitacao.ABERTA, dto.status());
        assertEquals(LocalDate.now().plusDays(SolicitacaoTitular.PRAZO_DIAS), dto.prazoEm());
        assertEquals("Mudança de escola", dto.detalhe());
        assertEquals("Ana Souza", dto.alunoNome());
        assertFalse(dto.atrasada());
    }

    @Test
    void solicitar_alunoDeOutroResponsavel_recusa() {
        Responsible outro = new Responsible("Carlos", "carlos@notus.com", null);
        outro.setId(11L);
        when(responsibleRepository.findByEmail("carlos@notus.com")).thenReturn(Optional.of(outro));
        when(studentRepository.findById(20L)).thenReturn(Optional.of(ana));

        assertThrows(AccessDeniedException.class, () -> service.solicitar(
                new SolicitacaoRequest(TipoSolicitacao.ANONIMIZACAO, 20L, null), "carlos@notus.com"));
        verify(solicitacaoRepository, never()).save(any());
    }

    @Test
    void solicitar_pedidoIgualEmAberto_recusa() {
        when(responsibleRepository.findByEmail("marta@notus.com")).thenReturn(Optional.of(marta));
        when(studentRepository.findById(20L)).thenReturn(Optional.of(ana));
        when(solicitacaoRepository.existeAberta(10L, 20L, TipoSolicitacao.ANONIMIZACAO, StatusSolicitacao.ABERTA))
                .thenReturn(true);

        assertThrows(ConflictException.class, () -> service.solicitar(
                new SolicitacaoRequest(TipoSolicitacao.ANONIMIZACAO, 20L, null), "marta@notus.com"));
        verify(solicitacaoRepository, never()).save(any());
    }

    @Test
    void responder_recusaSemMotivo_recusa() {
        SolicitacaoTitular pedido = new SolicitacaoTitular(TipoSolicitacao.ANONIMIZACAO, marta, ana, null, LocalDateTime.now());
        when(solicitacaoRepository.findById(1L)).thenReturn(Optional.of(pedido));

        assertThrows(RegraNegocioException.class, () -> service.responder(1L,
                new RespostaSolicitacaoRequest(StatusSolicitacao.RECUSADA, " "), "admin@notus.com"));
        assertTrue(pedido.aberta());
    }

    @Test
    void responder_pedidoJaRespondido_recusa() {
        SolicitacaoTitular pedido = new SolicitacaoTitular(TipoSolicitacao.ANONIMIZACAO, marta, ana, null, LocalDateTime.now());
        pedido.responder(StatusSolicitacao.ATENDIDA, null, "admin@notus.com", LocalDateTime.now());
        when(solicitacaoRepository.findById(1L)).thenReturn(Optional.of(pedido));

        assertThrows(ConflictException.class, () -> service.responder(1L,
                new RespostaSolicitacaoRequest(StatusSolicitacao.ATENDIDA, null), "admin@notus.com"));
    }

    @Test
    void responder_atendido_registraQuemRespondeu() {
        SolicitacaoTitular pedido = new SolicitacaoTitular(TipoSolicitacao.ANONIMIZACAO, marta, ana, null, LocalDateTime.now());
        when(solicitacaoRepository.findById(1L)).thenReturn(Optional.of(pedido));

        SolicitacaoDTO dto = service.responder(1L,
                new RespostaSolicitacaoRequest(StatusSolicitacao.ATENDIDA, "Dados anonimizados."), "admin@notus.com");

        assertEquals(StatusSolicitacao.ATENDIDA, dto.status());
        assertEquals("Dados anonimizados.", dto.resposta());
        assertEquals("admin@notus.com", pedido.getRespondidaPor());
        assertNotNull(dto.respondidaEm());
    }

    @Test
    void dto_pedidoAbertoForaDoPrazo_ficaAtrasado() {
        SolicitacaoTitular pedido = new SolicitacaoTitular(TipoSolicitacao.CORRECAO, marta, null, null,
                LocalDateTime.now().minusDays(SolicitacaoTitular.PRAZO_DIAS + 1));

        assertTrue(SolicitacaoDTO.from(pedido, LocalDate.now()).atrasada());
    }
}
