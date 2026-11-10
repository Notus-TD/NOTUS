package com.pfc.notus.user.service;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.domain.enums.TipoTokenSenha;
import com.pfc.notus.user.dto.ResponsibleRequest;
import com.pfc.notus.user.dto.StudentRegistrationResponse;
import com.pfc.notus.user.dto.StudentMinDTO;
import com.pfc.notus.user.dto.StudentRequest;
import com.pfc.notus.user.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
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

    @Mock
    private NotificacaoService notificacaoService;

    @Mock
    private SenhaService senhaService;

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
        when(userService.registrarSemConvite(any(Student.class), eq("ROLE_ALUNO"))).thenAnswer(inv -> {
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
        verify(userService, never()).registrarSemConvite(any(), any());
    }

    @Test
    void createStudentsRecusaEmailRepetidoNoLote() {
        List<StudentRequest> alunos = List.of(
                aluno("Lucas Pereira", "lucas@escola.com", 20260100L),
                aluno("Davi Pereira", " LUCAS@escola.com", 20260101L));

        assertThrows(ConflictException.class, () -> studentService.createStudents(RESPONSAVEL, alunos));
        verify(userService, never()).registrarSemConvite(any(), any());
    }

    private static Student alunoComMatricula(StatusMatricula status, Responsible responsavel) {
        Student student = new Student("Ana Aluna", "ana.aluna@gmail.com", 20260001L, LocalDate.of(2012, 5, 10), responsavel);
        student.setId(10L);
        student.setStatusMatricula(status);
        return student;
    }

    @Test
    void cancelarMatriculaTiraDaTurmaBloqueiaOLoginECancelaOsAvisos() {
        Student student = alunoComMatricula(StatusMatricula.ATIVA, null);
        student.setTurma(new Turma("9º Ano A", "2026"));
        when(studentRepository.findById(10L)).thenReturn(Optional.of(student));

        StudentMinDTO resultado = studentService.cancelarMatricula(10L, "admin@notus.com");

        assertEquals(StatusMatricula.CANCELADA, resultado.matriculaStatus());
        assertNull(student.getTurma());
        assertFalse(student.isAtivo());
        assertEquals("Ana Aluna", student.getFullName());
        verify(studentRepository).save(student);
        verify(notificacaoService).cancelarPendentesDoAluno(10L, "Matrícula cancelada");
    }

    @Test
    void cancelarMatriculaRecusaQuemNaoEstaAtivo() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(alunoComMatricula(StatusMatricula.FINALIZADA, null)));

        ConflictException excecao = assertThrows(ConflictException.class,
                () -> studentService.cancelarMatricula(10L, "admin@notus.com"));

        assertEquals("Só matrícula ativa pode ser cancelada.", excecao.getMessage());
        verify(studentRepository, never()).save(any());
    }

    @Test
    void cancelarMatriculaRecusaAlunoAnonimizado() {
        Student student = alunoComMatricula(StatusMatricula.ATIVA, null);
        student.setAnonimizadoEm(LocalDateTime.of(2026, 10, 1, 10, 0));
        when(studentRepository.findById(10L)).thenReturn(Optional.of(student));

        ConflictException excecao = assertThrows(ConflictException.class,
                () -> studentService.cancelarMatricula(10L, "admin@notus.com"));

        assertEquals("Usuário já foi anonimizado.", excecao.getMessage());
    }

    @Test
    void cancelarMatriculaLancaExcecaoQuandoAlunoNaoExiste() {
        when(studentRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException excecao = assertThrows(ResourceNotFoundException.class,
                () -> studentService.cancelarMatricula(99L, "admin@notus.com"));

        assertEquals("Aluno não encontrado com o id: 99", excecao.getMessage());
    }

    @Test
    void reativarMatriculaDevolveOAcessoESemTurma() {
        Student student = alunoComMatricula(StatusMatricula.CANCELADA, new Responsible());
        student.setAtivo(false);
        when(studentRepository.findById(10L)).thenReturn(Optional.of(student));

        StudentMinDTO resultado = studentService.reativarMatricula(10L, "admin@notus.com");

        assertEquals(StatusMatricula.ATIVA, resultado.matriculaStatus());
        assertTrue(student.isAtivo());
        assertNull(student.getTurma());
        verify(studentRepository).save(student);
    }

    @Test
    void reativarMatriculaRecusaQuemNaoEstaCancelado() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(alunoComMatricula(StatusMatricula.ATIVA, null)));

        ConflictException excecao = assertThrows(ConflictException.class,
                () -> studentService.reativarMatricula(10L, "admin@notus.com"));

        assertEquals("Só matrícula cancelada pode ser reativada.", excecao.getMessage());
        verify(studentRepository, never()).save(any());
    }

    @Test
    void reativarMatriculaRecusaQuandoOResponsavelFoiAnonimizado() {
        Responsible responsavel = new Responsible();
        responsavel.setAnonimizadoEm(LocalDateTime.of(2026, 10, 1, 10, 0));
        when(studentRepository.findById(10L)).thenReturn(Optional.of(alunoComMatricula(StatusMatricula.CANCELADA, responsavel)));

        ConflictException excecao = assertThrows(ConflictException.class,
                () -> studentService.reativarMatricula(10L, "admin@notus.com"));

        assertEquals("Não é possível reativar: o responsável deste aluno foi anonimizado.", excecao.getMessage());
        verify(studentRepository, never()).save(any());
    }

    private static Student alunoAtivo(Long id) {
        Student s = new Student("Lucas Pereira", "lucas@escola.com", 20260100L, LocalDate.of(2014, 3, 10), null);
        s.setId(id);
        return s;
    }

    @Test
    void updateStudentAtualizaNomeEmailMatriculaENascimento() {
        Student student = alunoAtivo(10L);
        when(studentRepository.findById(10L)).thenReturn(Optional.of(student));
        when(studentRepository.existsByMatriculaAndIdNot(20260200L, 10L)).thenReturn(false);

        var atualizado = studentService.updateStudent(10L,
                aluno("Lucas P. Souza", "lucas.souza@escola.com", 20260200L));

        assertEquals("Lucas P. Souza", atualizado.fullName());
        assertEquals(20260200L, atualizado.matricula());
        verify(userService).atualizarEmail(student, "lucas.souza@escola.com");
        verify(studentRepository).save(student);
    }

    @Test
    void updateStudentRecusaMatriculaJaUsadaPorOutroAluno() {
        Student student = alunoAtivo(10L);
        when(studentRepository.findById(10L)).thenReturn(Optional.of(student));
        when(studentRepository.existsByMatriculaAndIdNot(20260200L, 10L)).thenReturn(true);

        assertThrows(ConflictException.class,
                () -> studentService.updateStudent(10L, aluno("Lucas P. Souza", "lucas.souza@escola.com", 20260200L)));
        verify(studentRepository, never()).save(any());
    }

    private static Student alunoDaMarta() {
        Responsible marta = new Responsible("Marta", "marta@gmail.com", "11999999999");
        marta.setId(3L);
        Student student = alunoComMatricula(StatusMatricula.ATIVA, marta);
        student.setEmail(null);
        return student;
    }

    @Test
    void alunoSemAcessoLiberadoNaoConsegueEntrar() {
        Student student = alunoDaMarta();

        assertFalse(student.isEnabled());
        student.setAcessoLiberadoEm(LocalDateTime.of(2026, 11, 9, 10, 0));
        assertTrue(student.isEnabled());
    }

    @Test
    void liberarAcessoGravaOEmailADataEEnviaOConvite() {
        Student student = alunoDaMarta();
        when(studentRepository.findById(10L)).thenReturn(Optional.of(student));
        when(studentRepository.save(student)).thenReturn(student);

        StudentMinDTO resultado = studentService.liberarAcesso(10L, " ana@escola.com ", "marta@gmail.com");

        assertNotNull(resultado.acessoLiberadoEm());
        verify(userService).atualizarEmail(student, "ana@escola.com");
        verify(senhaService).gerarLink(student, TipoTokenSenha.CONVITE);
    }

    @Test
    void liberarAcessoRecusaQuemNaoEOResponsavelDoAluno() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(alunoDaMarta()));

        AccessDeniedException excecao = assertThrows(AccessDeniedException.class,
                () -> studentService.liberarAcesso(10L, "ana@escola.com", "outro@gmail.com"));

        assertEquals("Só o responsável do aluno pode liberar ou retirar o acesso.", excecao.getMessage());
        verify(senhaService, never()).gerarLink(any(), any());
    }

    @Test
    void liberarAcessoRecusaMatriculaQueNaoEstaAtiva() {
        Student student = alunoDaMarta();
        student.setStatusMatricula(StatusMatricula.CANCELADA);
        when(studentRepository.findById(10L)).thenReturn(Optional.of(student));

        ConflictException excecao = assertThrows(ConflictException.class,
                () -> studentService.liberarAcesso(10L, "ana@escola.com", "marta@gmail.com"));

        assertEquals("Só aluno com matrícula ativa pode ter acesso ao portal.", excecao.getMessage());
    }

    @Test
    void liberarAcessoRecusaOEmailDoProprioResponsavel() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(alunoDaMarta()));

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> studentService.liberarAcesso(10L, "Marta@gmail.com", "marta@gmail.com"));

        assertEquals("O e-mail do aluno deve ser diferente do e-mail do responsável.", excecao.getMessage());
    }

    @Test
    void retirarAcessoBloqueiaOLoginDoAluno() {
        Student student = alunoDaMarta();
        student.setAcessoLiberadoEm(LocalDateTime.of(2026, 11, 9, 10, 0));
        when(studentRepository.findById(10L)).thenReturn(Optional.of(student));
        when(studentRepository.save(student)).thenReturn(student);

        StudentMinDTO resultado = studentService.retirarAcesso(10L, "marta@gmail.com");

        assertNull(resultado.acessoLiberadoEm());
        assertFalse(student.isEnabled());
    }
}
