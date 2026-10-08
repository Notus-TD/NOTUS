package com.pfc.notus.user.service;

import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.Professor;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Role;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentAccessGuardServiceUnitTest {

    private static final Long ID_PROFESSOR = 2L;
    private static final Long ID_ALUNO = 10L;
    private static final Long ID_TURMA = 3L;
    private static final Long ID_MATEMATICA = 5L;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private LecionamentoRepository lecionamentoRepository;

    @InjectMocks
    private StudentAccessGuardService studentAccessGuardService;

    private <T extends User> T comIdEPapel(T usuario, Long id, String papel) {
        ReflectionTestUtils.setField(usuario, "id", id);
        usuario.addRole(new Role(null, papel));
        return usuario;
    }

    private Professor criarProfessor() {
        return comIdEPapel(new Professor("Pedro Professor", "pedro.professor@gmail.com"), ID_PROFESSOR, "ROLE_PROFESSOR");
    }

    private Student criarAluno(Long id, Turma turma) {
        Student aluno = new Student("Ana Aluna", "ana.aluna@gmail.com", 20260001L, LocalDate.of(2012, 5, 10), null);
        aluno.setTurma(turma);
        return comIdEPapel(aluno, id, "ROLE_ALUNO");
    }

    private Turma criarTurma() {
        Turma turma = new Turma("9º Ano A", "2026");
        ReflectionTestUtils.setField(turma, "id", ID_TURMA);
        return turma;
    }

    @Test
    void devePermitirLancarNotaQuandoProfessorLecionaADisciplinaNaTurmaDoAluno() {
        // Arrange
        Professor professor = criarProfessor();
        when(userRepository.findByEmail(professor.getEmail())).thenReturn(Optional.of(professor));
        when(studentRepository.findById(ID_ALUNO)).thenReturn(Optional.of(criarAluno(ID_ALUNO, criarTurma())));
        when(lecionamentoRepository.existsByProfessorIdAndTurmaIdAndDisciplinaId(ID_PROFESSOR, ID_TURMA, ID_MATEMATICA))
                .thenReturn(true);

        // Act + Assert
        assertDoesNotThrow(() -> studentAccessGuardService.assertCanTeach(ID_ALUNO, ID_MATEMATICA, professor.getEmail()));
        verify(lecionamentoRepository).existsByProfessorIdAndTurmaIdAndDisciplinaId(ID_PROFESSOR, ID_TURMA, ID_MATEMATICA);
    }

    @Test
    void deveNegarLancamentoDeNotaQuandoProfessorNaoLecionaADisciplinaNaTurmaDoAluno() {
        // Arrange
        Professor professor = criarProfessor();
        when(userRepository.findByEmail(professor.getEmail())).thenReturn(Optional.of(professor));
        when(studentRepository.findById(ID_ALUNO)).thenReturn(Optional.of(criarAluno(ID_ALUNO, criarTurma())));
        when(lecionamentoRepository.existsByProfessorIdAndTurmaIdAndDisciplinaId(ID_PROFESSOR, ID_TURMA, ID_MATEMATICA))
                .thenReturn(false);

        // Act
        AccessDeniedException excecao = assertThrows(AccessDeniedException.class,
                () -> studentAccessGuardService.assertCanTeach(ID_ALUNO, ID_MATEMATICA, professor.getEmail()));

        // Assert
        assertEquals("Sem permissão para lançar dados desta disciplina para este aluno.", excecao.getMessage());
    }

    @Test
    void deveNegarLancamentoDeNotaSemConsultarLecionamentoQuandoAlunoNaoTemTurma() {
        // Arrange
        Professor professor = criarProfessor();
        when(userRepository.findByEmail(professor.getEmail())).thenReturn(Optional.of(professor));
        when(studentRepository.findById(ID_ALUNO)).thenReturn(Optional.of(criarAluno(ID_ALUNO, null)));

        // Act
        AccessDeniedException excecao = assertThrows(AccessDeniedException.class,
                () -> studentAccessGuardService.assertCanTeach(ID_ALUNO, ID_MATEMATICA, professor.getEmail()));

        // Assert
        assertEquals("Sem permissão para lançar dados desta disciplina para este aluno.", excecao.getMessage());
        verify(lecionamentoRepository, never()).existsByProfessorIdAndTurmaIdAndDisciplinaId(anyLong(), anyLong(), anyLong());
    }

    @Test
    void devePermitirAdminLancarNotaSemConsultarAlunoNemLecionamento() {
        // Arrange
        User admin = comIdEPapel(new User("admin@notus.com"), 1L, "ROLE_ADMIN");
        when(userRepository.findByEmail("admin@notus.com")).thenReturn(Optional.of(admin));

        // Act + Assert
        assertDoesNotThrow(() -> studentAccessGuardService.assertCanTeach(ID_ALUNO, ID_MATEMATICA, "admin@notus.com"));
        verify(studentRepository, never()).findById(anyLong());
        verifyNoInteractions(lecionamentoRepository);
    }

    @Test
    void deveNegarLancamentoDeNotaQuandoUsuarioEhAlunoMesmoSendoAsPropriasNotas() {
        // Arrange
        Student aluno = criarAluno(ID_ALUNO, criarTurma());
        when(userRepository.findByEmail(aluno.getEmail())).thenReturn(Optional.of(aluno));

        // Act
        AccessDeniedException excecao = assertThrows(AccessDeniedException.class,
                () -> studentAccessGuardService.assertCanTeach(ID_ALUNO, ID_MATEMATICA, aluno.getEmail()));

        // Assert
        assertEquals("Sem permissão para lançar dados desta disciplina para este aluno.", excecao.getMessage());
        verifyNoInteractions(lecionamentoRepository);
    }

    @Test
    void devePermitirResponsavelVerNotasDoProprioFilho() {
        // Arrange
        Responsible responsavel = comIdEPapel(
                new Responsible("Marta Responsável", "marta.responsavel@gmail.com", "11999990000"), 20L, "ROLE_RESPONSAVEL");
        responsavel.getStudents().add(criarAluno(ID_ALUNO, criarTurma()));
        when(userRepository.findByEmail(responsavel.getEmail())).thenReturn(Optional.of(responsavel));

        // Act + Assert
        assertDoesNotThrow(() -> studentAccessGuardService.assertCanView(ID_ALUNO, responsavel.getEmail()));
    }

    @Test
    void deveNegarResponsavelVerNotasDeAlunoQueNaoEhSeuFilho() {
        // Arrange
        Responsible responsavel = comIdEPapel(
                new Responsible("Marta Responsável", "marta.responsavel@gmail.com", "11999990000"), 20L, "ROLE_RESPONSAVEL");
        responsavel.getStudents().add(criarAluno(ID_ALUNO, criarTurma()));
        when(userRepository.findByEmail(responsavel.getEmail())).thenReturn(Optional.of(responsavel));

        // Act
        AccessDeniedException excecao = assertThrows(AccessDeniedException.class,
                () -> studentAccessGuardService.assertCanView(99L, responsavel.getEmail()));

        // Assert
        assertEquals("Sem permissão para ver os dados deste aluno.", excecao.getMessage());
    }

    @Test
    void deveLancarExcecaoQuandoUsuarioAutenticadoNaoExiste() {
        // Arrange
        when(userRepository.findByEmail("fantasma@gmail.com")).thenReturn(Optional.empty());

        // Act
        ResourceNotFoundException excecao = assertThrows(ResourceNotFoundException.class,
                () -> studentAccessGuardService.assertCanView(ID_ALUNO, "fantasma@gmail.com"));

        // Assert
        assertEquals("Usuário autenticado não encontrado: fantasma@gmail.com", excecao.getMessage());
        verifyNoInteractions(studentRepository, lecionamentoRepository);
    }
}
