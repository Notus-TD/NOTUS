package com.pfc.notus.user.service;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.user.domain.Professor;
import com.pfc.notus.user.dto.ProfessorDTO;
import com.pfc.notus.user.dto.ProfessorRequest;
import com.pfc.notus.user.repository.ProfessorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfessorServiceUnitTest {

    @Mock
    private ProfessorRepository professorRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private ProfessorService professorService;

    @Test
    void createProfessorRegistraComPapelDeProfessor() {
        when(userService.register(any(Professor.class), eq("ROLE_PROFESSOR"))).thenAnswer(inv -> {
            Professor p = inv.getArgument(0);
            p.setId(2026000200L);
            return p;
        });

        ProfessorDTO dto = professorService.createProfessor(
                new ProfessorRequest("  Luciana Almeida ", " luciana@escola.com "));

        assertEquals(new ProfessorDTO(2026000200L, "Luciana Almeida", "luciana@escola.com"), dto);
        ArgumentCaptor<Professor> captor = ArgumentCaptor.forClass(Professor.class);
        verify(userService).register(captor.capture(), eq("ROLE_PROFESSOR"));
        assertEquals("luciana@escola.com", captor.getValue().getEmail());
    }

    @Test
    void createProfessorPropagaEmailJaCadastrado() {
        when(userService.register(any(Professor.class), eq("ROLE_PROFESSOR")))
                .thenThrow(new ConflictException("E-mail já cadastrado: luciana@escola.com"));

        assertThrows(ConflictException.class, () -> professorService.createProfessor(
                new ProfessorRequest("Luciana Almeida", "luciana@escola.com")));
    }

    @Test
    void listProfessorsIgnoraAnonimizados() {
        Professor ativo = new Professor("Luciana Almeida", "luciana@escola.com");
        ativo.setId(1L);
        Professor anonimizado = new Professor("Removido", "removido@escola.com");
        anonimizado.setId(2L);
        anonimizado.setAnonimizadoEm(LocalDateTime.of(2026, 5, 1, 10, 0));
        when(professorRepository.findAll(Sort.by("fullName"))).thenReturn(List.of(ativo, anonimizado));

        assertEquals(List.of(new ProfessorDTO(1L, "Luciana Almeida", "luciana@escola.com")),
                professorService.listProfessors());
    }
}
