package com.pfc.notus.user.service;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.dto.ResponsibleRequest;
import com.pfc.notus.user.dto.StudentRegistrationResponse;
import com.pfc.notus.user.dto.StudentRequest;
import com.pfc.notus.user.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentServiceUnitTest {

    private static final ResponsibleRequest RESPONSAVEL =
            new ResponsibleRequest("Roberto Pereira", "roberto@gmail.com", "11981000000");

    @Mock
    private UserService userService;

    @Mock
    private ResponsibleService responsibleService;

    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private StudentService studentService;

    private static StudentRequest aluno(String nome, String email, long matricula) {
        return new StudentRequest(nome, email, matricula, LocalDate.of(2014, 3, 10));
    }

    @Test
    void createStudentsCadastraTodosOsAlunosNoMesmoResponsavel() {
        Responsible responsible = new Responsible();
        AtomicLong ids = new AtomicLong(2026000100L);
        when(studentRepository.findByMatricula(anyLong())).thenReturn(Optional.empty());
        when(responsibleService.findOrCreateResponsible(RESPONSAVEL)).thenReturn(responsible);
        when(userService.register(any(Student.class), eq("ROLE_ALUNO"))).thenAnswer(inv -> {
            Student s = inv.getArgument(0);
            s.setId(ids.getAndIncrement());
            return s;
        });

        List<StudentRegistrationResponse> res = studentService.createStudents(RESPONSAVEL, List.of(
                aluno("Lucas Pereira", "lucas@escola.com", 20260100L),
                aluno("Davi Pereira", "davi@escola.com", 20260101L)));

        assertEquals(List.of(
                new StudentRegistrationResponse(2026000100L, "Lucas Pereira"),
                new StudentRegistrationResponse(2026000101L, "Davi Pereira")), res);
        verify(responsibleService, times(2)).findOrCreateResponsible(RESPONSAVEL);
    }

    @Test
    void createStudentsRecusaMatriculaRepetidaNoLote() {
        List<StudentRequest> alunos = List.of(
                aluno("Lucas Pereira", "lucas@escola.com", 20260100L),
                aluno("Davi Pereira", "davi@escola.com", 20260100L));

        assertThrows(ConflictException.class, () -> studentService.createStudents(RESPONSAVEL, alunos));
        verify(userService, never()).register(any(), any());
    }

    @Test
    void createStudentsRecusaEmailRepetidoNoLote() {
        List<StudentRequest> alunos = List.of(
                aluno("Lucas Pereira", "lucas@escola.com", 20260100L),
                aluno("Davi Pereira", " LUCAS@escola.com", 20260101L));

        assertThrows(ConflictException.class, () -> studentService.createStudents(RESPONSAVEL, alunos));
        verify(userService, never()).register(any(), any());
    }
}
