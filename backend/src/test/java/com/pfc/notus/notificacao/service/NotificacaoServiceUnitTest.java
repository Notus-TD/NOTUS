package com.pfc.notus.notificacao.service;

import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.comunicado.domain.Comunicado;
import com.pfc.notus.comunicado.domain.PublicoComunicado;
import com.pfc.notus.comunicado.repository.ComunicadoRepository;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.notificacao.domain.Notificacao;
import com.pfc.notus.notificacao.domain.StatusNotificacao;
import com.pfc.notus.notificacao.domain.TipoNotificacao;
import com.pfc.notus.notificacao.dto.AvisoDTO;
import com.pfc.notus.notificacao.repository.NotificacaoRepository;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.ResponsibleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificacaoServiceUnitTest {

    @Mock
    private NotificacaoRepository notificacaoRepository;

    @Mock
    private BoletimRepository boletimRepository;

    @Mock
    private ComunicadoRepository comunicadoRepository;

    @Mock
    private ResponsibleRepository responsibleRepository;

    @Spy
    private TemplateRegistry templateRegistry = new TemplateRegistry();

    @Spy
    private ObjectMapper objectMapper = JsonMapper.builder().build();

    @InjectMocks
    private NotificacaoService notificacaoService;

    private Responsible responsavel;
    private Student aluno;

    @BeforeEach
    void setUp() {
        responsavel = new Responsible("Marta Souza", "marta@gmail.com", "11999999999");
        responsavel.setId(3L);
        responsavel.setTermsAcceptedAt(LocalDateTime.now());
        aluno = new Student("Ana Souza", "ana@gmail.com", 20260001L, LocalDate.of(2013, 1, 1), responsavel);
        aluno.setId(1L);
        responsavel.getStudents().add(aluno);
        lenient().when(notificacaoRepository.save(any(Notificacao.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private Notificacao salvaPeloServico() {
        ArgumentCaptor<Notificacao> captor = ArgumentCaptor.forClass(Notificacao.class);
        verify(notificacaoRepository).save(captor.capture());
        return captor.getValue();
    }

    @Test
    void notaAtualizadaUsaOTextoDeAtualizacao() {
        Disciplina matematica = new Disciplina("Matemática", "Álgebra");
        ReflectionTestUtils.setField(matematica, "id", 5L);
        Boletim boletim = new Boletim(aluno, matematica, Bimestre.PRIMEIRO);
        ReflectionTestUtils.setField(boletim, "id", 50L);
        boletim.setNotaFinal(7f);
        boletim.setLancadoEm(LocalDateTime.now());
        when(boletimRepository.findById(50L)).thenReturn(Optional.of(boletim));

        notificacaoService.notificarNotaFinal(50L, true);

        Notificacao criada = salvaPeloServico();
        assertEquals(TipoNotificacao.NOTA_FINAL, criada.getTipo());
        assertEquals("nota_atualizada", criada.getTemplate());
    }

    @Test
    void notaLancadaPelaPrimeiraVezUsaOTextoPadrao() {
        Disciplina matematica = new Disciplina("Matemática", "Álgebra");
        Boletim boletim = new Boletim(aluno, matematica, Bimestre.PRIMEIRO);
        ReflectionTestUtils.setField(boletim, "id", 50L);
        boletim.setNotaFinal(7f);
        boletim.setLancadoEm(LocalDateTime.now());
        when(boletimRepository.findById(50L)).thenReturn(Optional.of(boletim));

        notificacaoService.notificarNotaFinal(50L, false);

        assertEquals("nota_final", salvaPeloServico().getTemplate());
    }

    @Test
    void comunicadoAvisaSoResponsaveisQueAceitaramOsTermos() {
        Responsible semAceite = new Responsible("Carlos", "carlos@gmail.com", "11988888888");
        semAceite.setId(4L);
        Student filhoDoCarlos = new Student("Beto", "beto@gmail.com", 20260002L, LocalDate.of(2013, 1, 1), semAceite);
        semAceite.getStudents().add(filhoDoCarlos);
        Comunicado comunicado = new Comunicado("Reunião", "Sábado.", PublicoComunicado.TODOS, "admin@notus.com", LocalDateTime.now());
        ReflectionTestUtils.setField(comunicado, "id", 7L);
        when(comunicadoRepository.findById(7L)).thenReturn(Optional.of(comunicado));
        when(responsibleRepository.findAll()).thenReturn(List.of(responsavel, semAceite));

        notificacaoService.notificarComunicado(7L);

        Notificacao criada = salvaPeloServico();
        assertEquals(TipoNotificacao.COMUNICADO, criada.getTipo());
        assertEquals(3L, criada.getResponsavel().getId());
        assertNull(criada.getStudent());
    }

    @Test
    void avisosDoResponsavelVemComTituloETextoSemRodape() {
        Notificacao falta = new Notificacao(TipoNotificacao.FALTA, responsavel, aluno, "FALTA", 9L, "k",
                "falta_aluno", "[\"Marta\",\"Ana\",\"Matemática\",\"02/03/2026\",\"1\"]");
        when(responsibleRepository.findByEmail("marta@gmail.com")).thenReturn(Optional.of(responsavel));
        when(notificacaoRepository.buscarAvisosDoResponsavel(3L, StatusNotificacao.CANCELADA, TipoNotificacao.COMUNICADO))
                .thenReturn(List.of(falta));

        List<AvisoDTO> avisos = notificacaoService.avisosDoResponsavel("marta@gmail.com");

        assertEquals(1, avisos.size());
        AvisoDTO aviso = avisos.get(0);
        assertEquals("Falta registrada", aviso.titulo());
        assertEquals("Ana", aviso.alunoNome());
        assertTrue(aviso.texto().contains("Registramos uma falta de Ana em Matemática no dia 02/03/2026"), aviso.texto());
        assertFalse(aviso.texto().contains("Mensagem automática"));
    }
}
