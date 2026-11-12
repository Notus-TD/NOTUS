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
import com.pfc.notus.user.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
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

    @Mock
    private StudentRepository studentRepository;

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
        assertEquals("Ana Souza", aviso.alunoNome());
        assertTrue(aviso.texto().contains("Registramos uma falta de Ana em Matemática no dia 02/03/2026"), aviso.texto());
        assertFalse(aviso.texto().contains("Mensagem automática"));
    }

    @Test
    void recadoDeTurmaAvisaSoOsResponsaveisDaTurma() {
        Comunicado recado = new Comunicado("Prova", "Quinta.", "pedro@gmail.com", LocalDateTime.now(), 10L);
        ReflectionTestUtils.setField(recado, "id", 8L);
        when(comunicadoRepository.findById(8L)).thenReturn(Optional.of(recado));
        when(studentRepository.findByTurmaId(10L, Sort.unsorted())).thenReturn(List.of(aluno));

        notificacaoService.notificarComunicado(8L);

        assertEquals(3L, salvaPeloServico().getResponsavel().getId());
        verify(responsibleRepository, never()).findAll();
    }

    @Test
    void apagarVencidas_apagaRegistrosComMaisDeSeisMeses() {
        when(notificacaoRepository.apagarCriadasAntesDe(any())).thenReturn(3);
        LocalDateTime antes = LocalDateTime.now().minusMonths(NotificacaoService.MESES_RETENCAO);

        int apagadas = notificacaoService.apagarVencidas();

        ArgumentCaptor<LocalDateTime> limite = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(notificacaoRepository).apagarCriadasAntesDe(limite.capture());
        assertEquals(3, apagadas);
        assertFalse(limite.getValue().isBefore(antes));
        assertTrue(limite.getValue().isBefore(LocalDateTime.now().minusMonths(NotificacaoService.MESES_RETENCAO).plusSeconds(1)));
    }

    // Testes para notificações de alunos

    @Test
    void notaFinalCriaNotificacaoParaAlunoComAcessoLiberado() {
        // Aluno com acesso liberado
        aluno.setAcessoLiberadoEm(LocalDateTime.now());
        aluno.setStatusMatricula(com.pfc.notus.user.domain.enums.StatusMatricula.ATIVA);

        Disciplina matematica = new Disciplina("Matemática", "Álgebra");
        Boletim boletim = new Boletim(aluno, matematica, Bimestre.PRIMEIRO);
        ReflectionTestUtils.setField(boletim, "id", 50L);
        boletim.setNotaFinal(7f);
        boletim.setLancadoEm(LocalDateTime.now());
        when(boletimRepository.findById(50L)).thenReturn(Optional.of(boletim));

        notificacaoService.notificarNotaFinal(50L, false);

        // Deve criar 2 notificações: uma para responsável, uma para aluno
        ArgumentCaptor<Notificacao> captor = ArgumentCaptor.forClass(Notificacao.class);
        verify(notificacaoRepository, times(2)).save(captor.capture());

        List<Notificacao> notificacoes = captor.getAllValues();
        // Primeira é para responsável
        assertEquals(responsavel.getId(), notificacoes.get(0).getResponsavel().getId());
        assertEquals(aluno.getId(), notificacoes.get(0).getStudent().getId());
        // Segunda é para aluno (responsável null)
        assertNull(notificacoes.get(1).getResponsavel());
        assertEquals(aluno.getId(), notificacoes.get(1).getStudent().getId());
    }

    @Test
    void notaFinalNaoCriaNotificacaoParaAlunoSemAcessoLiberado() {
        // Aluno SEM acesso liberado
        aluno.setAcessoLiberadoEm(null);
        aluno.setStatusMatricula(com.pfc.notus.user.domain.enums.StatusMatricula.ATIVA);

        Disciplina matematica = new Disciplina("Matemática", "Álgebra");
        Boletim boletim = new Boletim(aluno, matematica, Bimestre.PRIMEIRO);
        ReflectionTestUtils.setField(boletim, "id", 50L);
        boletim.setNotaFinal(7f);
        boletim.setLancadoEm(LocalDateTime.now());
        when(boletimRepository.findById(50L)).thenReturn(Optional.of(boletim));

        notificacaoService.notificarNotaFinal(50L, false);

        // Deve criar apenas 1 notificação: para responsável
        ArgumentCaptor<Notificacao> captor = ArgumentCaptor.forClass(Notificacao.class);
        verify(notificacaoRepository, times(1)).save(captor.capture());

        Notificacao notificacao = captor.getValue();
        assertEquals(responsavel.getId(), notificacao.getResponsavel().getId());
        assertEquals(aluno.getId(), notificacao.getStudent().getId());
    }

    @Test
    void notificacaoParaAlunoTemChaveUnicaDiferente() {
        aluno.setAcessoLiberadoEm(LocalDateTime.now());
        aluno.setStatusMatricula(com.pfc.notus.user.domain.enums.StatusMatricula.ATIVA);

        Disciplina matematica = new Disciplina("Matemática", "Álgebra");
        Boletim boletim = new Boletim(aluno, matematica, Bimestre.PRIMEIRO);
        ReflectionTestUtils.setField(boletim, "id", 50L);
        boletim.setNotaFinal(7f);
        boletim.setLancadoEm(LocalDateTime.now());
        when(boletimRepository.findById(50L)).thenReturn(Optional.of(boletim));

        notificacaoService.notificarNotaFinal(50L, false);

        ArgumentCaptor<Notificacao> captor = ArgumentCaptor.forClass(Notificacao.class);
        verify(notificacaoRepository, times(2)).save(captor.capture());

        List<Notificacao> notificacoes = captor.getAllValues();
        String chaveResponsavel = notificacoes.get(0).getChaveIdempotencia();
        String chaveAluno = notificacoes.get(1).getChaveIdempotencia();

        // Chaves devem ser diferentes
        assertNotEquals(chaveResponsavel, chaveAluno);
        assertTrue(chaveResponsavel.contains("RESPONSAVEL"));
        assertTrue(chaveAluno.contains("ALUNO"));
    }
}
