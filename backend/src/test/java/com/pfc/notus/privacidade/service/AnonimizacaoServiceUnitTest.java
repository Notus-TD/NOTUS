package com.pfc.notus.privacidade.service;

import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.entrega.repository.EntregaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.falta.repository.FaltaRepository;
import com.pfc.notus.notificacao.repository.NotificacaoRepository;
import com.pfc.notus.privacidade.domain.MotivoAnonimizacao;
import com.pfc.notus.privacidade.dto.AnonimizarRequest;
import com.pfc.notus.privacidade.dto.RegistroAnonimizacaoDTO;
import com.pfc.notus.privacidade.dto.ResumoAnonimizacaoDTO;
import com.pfc.notus.privacidade.repository.RegistroAnonimizacaoRepository;
import com.pfc.notus.privacidade.repository.SolicitacaoTitularRepository;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnonimizacaoServiceUnitTest {

    private static final String ADMIN = "admin@notus.com";

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private SolicitacaoTitularService solicitacaoTitularService;

    @Mock
    private SolicitacaoTitularRepository solicitacaoRepository;

    @Mock
    private RegistroAnonimizacaoRepository registroRepository;

    @Mock
    private BoletimRepository boletimRepository;

    @Mock
    private FaltaRepository faltaRepository;

    @Mock
    private EntregaRepository entregaRepository;

    @Mock
    private NotificacaoRepository notificacaoRepository;

    @InjectMocks
    private AnonimizacaoService service;

    private Responsible simone;
    private Student helena;

    @BeforeEach
    void setUp() {
        simone = new Responsible("Simone Barbosa", "simone@notus.com", "11999999999");
        simone.setId(24L);
        helena = new Student("Helena Barbosa", "helena@notus.com", 20260011L, LocalDate.of(2015, 2, 1), simone);
        helena.setId(54L);
        simone.getStudents().add(helena);
    }

    @Test
    void resumo_alunoComMatriculaAtiva_informaOBloqueioEOQueEstaLigado() {
        when(userRepository.findById(54L)).thenReturn(Optional.of(helena));
        when(solicitacaoRepository.listarAbertasDoUsuario(54L)).thenReturn(List.of());
        when(registroRepository.findFirstByUsuarioIdOrderByExecutadoEmDesc(54L)).thenReturn(Optional.empty());
        when(boletimRepository.countByStudentId(54L)).thenReturn(24L);
        when(faltaRepository.countByAlunoId(54L)).thenReturn(3L);

        ResumoAnonimizacaoDTO resumo = service.resumo(54L);

        assertEquals("ALUNO", resumo.perfil());
        assertEquals(24L, resumo.notasDeBimestre());
        assertEquals(3L, resumo.faltas());
        assertEquals("Cancele a matrícula do aluno antes de anonimizar.", resumo.bloqueio());
    }

    @Test
    void resumo_responsavelComFilhoAtivo_listaOsFilhosEBloqueia() {
        when(userRepository.findById(24L)).thenReturn(Optional.of(simone));
        when(solicitacaoRepository.listarAbertasDoUsuario(24L)).thenReturn(List.of());
        when(registroRepository.findFirstByUsuarioIdOrderByExecutadoEmDesc(24L)).thenReturn(Optional.empty());

        ResumoAnonimizacaoDTO resumo = service.resumo(24L);

        assertEquals(1, resumo.filhos().size());
        assertEquals("O responsável tem aluno com matrícula ativa: Helena Barbosa.", resumo.bloqueio());
    }

    @Test
    void anonimizar_motivoOutroSemDetalhe_recusa() {
        assertThrows(RegraNegocioException.class, () -> service.anonimizar(54L,
                new AnonimizarRequest("20260011", MotivoAnonimizacao.OUTRO, " ", null), ADMIN));
        verify(userService, never()).anonimyzeUser(anyLong(), anyString(), anyString());
    }

    @Test
    void anonimizar_pedidoDoTitularSemPedido_recusa() {
        assertThrows(RegraNegocioException.class, () -> service.anonimizar(54L,
                new AnonimizarRequest("20260011", MotivoAnonimizacao.PEDIDO_DO_TITULAR, null, null), ADMIN));
        verify(userService, never()).anonimyzeUser(anyLong(), anyString(), anyString());
    }

    @Test
    void anonimizar_comPedido_atendeOPedidoAnonimizaERegistraOMotivo() {
        helena.setStatusMatricula(StatusMatricula.CANCELADA);
        when(userRepository.findById(54L)).thenReturn(Optional.of(helena));
        when(registroRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        RegistroAnonimizacaoDTO registro = service.anonimizar(54L,
                new AnonimizarRequest("20260011", MotivoAnonimizacao.PEDIDO_DO_TITULAR, "Mudou de escola", 7L), ADMIN);

        verify(solicitacaoTitularService).atenderPorAnonimizacao(7L, 54L, ADMIN);
        verify(userService).anonimyzeUser(54L, "20260011", ADMIN);
        assertEquals("ALUNO", registro.perfil());
        assertEquals(20260011L, registro.matricula());
        assertEquals("Pedido do titular", registro.motivoDescricao());
        assertEquals(ADMIN, registro.executadoPor());
    }
}
