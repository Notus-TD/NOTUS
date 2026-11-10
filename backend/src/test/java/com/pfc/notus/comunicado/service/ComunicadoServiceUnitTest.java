package com.pfc.notus.comunicado.service;

import com.pfc.notus.comunicado.domain.Comunicado;
import com.pfc.notus.comunicado.domain.PublicoComunicado;
import com.pfc.notus.comunicado.dto.ComunicadoDTO;
import com.pfc.notus.comunicado.dto.ComunicadoRequest;
import com.pfc.notus.comunicado.repository.ComunicadoRepository;
import com.pfc.notus.notificacao.event.ComunicadoPublicadoEvent;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.Role;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.UserRepository;
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
import java.util.Collection;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComunicadoServiceUnitTest {

    @Mock
    private ComunicadoRepository comunicadoRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ComunicadoService comunicadoService;

    private void salvarComId() {
        when(comunicadoRepository.save(any(Comunicado.class))).thenAnswer(inv -> {
            Comunicado c = inv.getArgument(0);
            ReflectionTestUtils.setField(c, "id", 7L);
            return c;
        });
    }

    @Test
    void comunicadoParaResponsaveisGeraAvisoPorEmail() {
        salvarComId();

        ComunicadoDTO dto = comunicadoService.publicar(
                new ComunicadoRequest("  Reunião de pais ", " Sábado às 9h. ", PublicoComunicado.RESPONSAVEIS),
                "admin@notus.com");

        assertEquals("Reunião de pais", dto.titulo());
        assertEquals("Sábado às 9h.", dto.texto());
        verify(eventPublisher).publishEvent(new ComunicadoPublicadoEvent(7L));
    }

    @Test
    void comunicadoSoParaProfessoresNaoAvisaResponsaveis() {
        salvarComId();

        comunicadoService.publicar(new ComunicadoRequest("Conselho", "Quinta.", PublicoComunicado.PROFESSORES),
                "admin@notus.com");

        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void responsavelVeComunicadosDeTodaAEscolaEOsDosResponsaveis() {
        Responsible responsavel = new Responsible("Marta", "marta@gmail.com", "11999999999");
        responsavel.addRole(new Role(3L, "ROLE_RESPONSAVEL"));
        when(comunicadoRepository.findByPublicoInAndAnoLetivoOrderByEnviadoEmDesc(any(), any())).thenReturn(List.of());

        comunicadoService.listarParaUsuario(responsavel);

        ArgumentCaptor<Collection<PublicoComunicado>> publicos = ArgumentCaptor.forClass(Collection.class);
        verify(comunicadoRepository).findByPublicoInAndAnoLetivoOrderByEnviadoEmDesc(publicos.capture(), any());
        assertEquals(EnumSet.of(PublicoComunicado.TODOS, PublicoComunicado.RESPONSAVEIS), EnumSet.copyOf(publicos.getValue()));
    }

    @Test
    void responsavelSoVeORecadoDaTurmaDoFilho() {
        Responsible responsavel = new Responsible("Marta", "marta@gmail.com", "11999999999");
        responsavel.addRole(new Role(3L, "ROLE_RESPONSAVEL"));
        Turma oitavoA = new Turma("8º Ano A", "2026");
        ReflectionTestUtils.setField(oitavoA, "id", 10L);
        Student filho = new Student("Ana", "ana@gmail.com", 20260001L, LocalDate.of(2013, 1, 1), responsavel);
        filho.setTurma(oitavoA);
        responsavel.getStudents().add(filho);
        Comunicado geral = new Comunicado("Reunião", "Sábado.", PublicoComunicado.RESPONSAVEIS, "admin@notus.com", LocalDateTime.now());
        Comunicado daTurma = new Comunicado("Prova", "Quinta.", "pedro@gmail.com", LocalDateTime.now(), 10L);
        Comunicado deOutraTurma = new Comunicado("Passeio", "Sexta.", "pedro@gmail.com", LocalDateTime.now(), 20L);
        when(comunicadoRepository.findByPublicoInAndAnoLetivoOrderByEnviadoEmDesc(any(), any()))
                .thenReturn(List.of(geral, daTurma, deOutraTurma));
        when(userRepository.findByEmail("marta@gmail.com")).thenReturn(Optional.of(responsavel));

        List<ComunicadoDTO> vistos = comunicadoService.listarParaUsuario(responsavel);

        assertEquals(List.of("Reunião", "Prova"), vistos.stream().map(ComunicadoDTO::titulo).toList());
    }
}
