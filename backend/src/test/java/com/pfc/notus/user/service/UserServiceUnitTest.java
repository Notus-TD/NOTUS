package com.pfc.notus.user.service;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.user.domain.Professor;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.dto.UsuarioDTO;
import com.pfc.notus.user.repository.ResponsibleRepository;
import com.pfc.notus.user.repository.RoleRepository;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.util.AuthUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceUnitTest {

    private static final String ADMIN = "admin@notus.com";

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private ResponsibleRepository responsibleRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthUtil authUtil;

    @Mock
    private NotificacaoService notificacaoService;

    @InjectMocks
    private UserService userService;

    private Responsible criarResponsavel(Long id, String nome) {
        Responsible responsavel = new Responsible(nome, "marta.responsavel@gmail.com", "11977770000");
        ReflectionTestUtils.setField(responsavel, "id", id);
        responsavel.setTermsAcceptedAt(LocalDateTime.of(2026, 2, 1, 8, 0));
        return responsavel;
    }

    private Student criarAluno(Long id, Long matricula, String nome, Responsible responsavel) {
        Student aluno = new Student(nome, "ana.aluna@gmail.com", matricula, LocalDate.of(2012, 5, 10), responsavel);
        ReflectionTestUtils.setField(aluno, "id", id);
        aluno.setPassword("$2a$10$hash");
        aluno.setTermsAcceptedAt(LocalDateTime.of(2026, 2, 1, 8, 0));
        aluno.setTurma(new Turma("9º Ano A", "2026"));
        return aluno;
    }

    private Professor criarProfessor() {
        Professor professor = new Professor("Pedro Professor", "pedro.professor@gmail.com");
        ReflectionTestUtils.setField(professor, "id", 2L);
        return professor;
    }

    @Test
    void deveAnonimizarOAlunoMantendoSoOIdEAMatricula() {
        Student aluno = criarAluno(10L, 20260001L, "Ana Aluna", criarResponsavel(3L, "Marta Responsável"));
        when(userRepository.findById(10L)).thenReturn(Optional.of(aluno));

        userService.anonimyzeUser(10L, " 20260001 ", ADMIN);

        assertEquals(10L, aluno.getId());
        assertEquals(20260001L, aluno.getMatricula());
        assertNull(aluno.getFullName());
        assertNull(aluno.getEmail());
        assertNull(aluno.getBirthDate());
        assertNull(aluno.getPassword());
        assertNull(aluno.getTermsAcceptedAt());
        assertNull(aluno.getResponsible());
        assertNull(aluno.getTurma());
        assertFalse(aluno.isAtivo());
        assertEquals(StatusMatricula.FINALIZADA, aluno.getStatusMatricula());
        assertNotNull(aluno.getAnonimizadoEm());
        verify(userRepository).save(aluno);
        verify(notificacaoService).cancelarPendentesDoAluno(10L, "Aluno anonimizado");
        verify(notificacaoService).apagarDadosDoAluno(10L);
    }

    @Test
    void deveRecusarAnonimizarOAlunoQuandoAMatriculaNaoConfere() {
        Student aluno = criarAluno(10L, 20260001L, "Ana Aluna", null);
        when(userRepository.findById(10L)).thenReturn(Optional.of(aluno));

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> userService.anonimyzeUser(10L, "10", ADMIN));

        assertEquals("A matrícula digitada não confere com a do aluno.", excecao.getMessage());
        assertEquals("Ana Aluna", aluno.getFullName());
        verify(userRepository, never()).save(any());
        verify(notificacaoService, never()).apagarDadosDoAluno(anyLong());
    }

    @Test
    void deveRecusarAnonimizarSemConfirmacao() {
        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> userService.anonimyzeUser(10L, "  ", ADMIN));

        assertEquals("Digite a matrícula do aluno ou o registro do responsável para confirmar.", excecao.getMessage());
        verify(userRepository, never()).findById(anyLong());
    }

    @Test
    void deveLancarExcecaoQuandoUsuarioNaoExiste() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException excecao = assertThrows(ResourceNotFoundException.class,
                () -> userService.anonimyzeUser(99L, "99", ADMIN));

        assertEquals("Usuário não encontrado: 99", excecao.getMessage());
    }

    @Test
    void deveRecusarAnonimizarUsuarioJaAnonimizado() {
        Student aluno = criarAluno(10L, 20260001L, "Ana Aluna", null);
        aluno.setAnonimizadoEm(LocalDateTime.of(2026, 10, 1, 10, 0));
        when(userRepository.findById(10L)).thenReturn(Optional.of(aluno));

        ConflictException excecao = assertThrows(ConflictException.class,
                () -> userService.anonimyzeUser(10L, "20260001", ADMIN));

        assertEquals("Usuário já foi anonimizado.", excecao.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void deveRecusarAnonimizarProfessor() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(criarProfessor()));

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> userService.anonimyzeUser(2L, "2", ADMIN));

        assertEquals("Só alunos e responsáveis podem ser anonimizados.", excecao.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void deveRecusarAnonimizarOResponsavelQuandoORegistroNaoConfere() {
        when(userRepository.findById(3L)).thenReturn(Optional.of(criarResponsavel(3L, "Marta Responsável")));

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> userService.anonimyzeUser(3L, "4", ADMIN));

        assertEquals("O registro digitado não confere com o do responsável.", excecao.getMessage());
        verify(studentRepository, never()).existsByResponsibleIdAndStatusMatricula(anyLong(), any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void deveAnonimizarOResponsavelSemAlunoComMatriculaAtiva() {
        Responsible responsavel = criarResponsavel(3L, "Marta Responsável");
        when(userRepository.findById(3L)).thenReturn(Optional.of(responsavel));
        when(studentRepository.existsByResponsibleIdAndStatusMatricula(3L, StatusMatricula.ATIVA)).thenReturn(false);

        userService.anonimyzeUser(3L, "3", ADMIN);

        assertEquals(3L, responsavel.getId());
        assertNull(responsavel.getName());
        assertNull(responsavel.getEmail());
        assertNull(responsavel.getPhone());
        assertNull(responsavel.getTermsAcceptedAt());
        assertFalse(responsavel.isAtivo());
        assertNotNull(responsavel.getAnonimizadoEm());
        verify(userRepository).save(responsavel);
        verify(notificacaoService).cancelarPendentesDoResponsavel(3L, "Responsável anonimizado");
        verify(notificacaoService).apagarDadosDoResponsavel(3L);
    }

    @Test
    void deveBloquearAnonimizarOResponsavelComAlunoDeMatriculaAtiva() {
        Responsible responsavel = criarResponsavel(3L, "Marta Responsável");
        when(userRepository.findById(3L)).thenReturn(Optional.of(responsavel));
        when(studentRepository.existsByResponsibleIdAndStatusMatricula(3L, StatusMatricula.ATIVA)).thenReturn(true);

        ConflictException excecao = assertThrows(ConflictException.class,
                () -> userService.anonimyzeUser(3L, "3", ADMIN));

        assertEquals("Não é possível anonimizar: o responsável tem aluno com matrícula ativa.", excecao.getMessage());
        assertEquals("Marta Responsável", responsavel.getName());
        verify(userRepository, never()).save(any());
    }

    @Test
    void deveListarAlunosEResponsaveisComOsAnonimizadosNoFim() {
        Student ana = criarAluno(10L, 20260001L, "Ana Aluna", null);
        Student anonimizado = criarAluno(11L, 20260009L, null, null);
        anonimizado.setAnonimizadoEm(LocalDateTime.of(2026, 10, 1, 10, 0));
        when(studentRepository.findAll()).thenReturn(List.of(anonimizado, ana));
        when(responsibleRepository.findAll()).thenReturn(List.of(criarResponsavel(3L, "Marta Responsável")));

        List<UsuarioDTO> resultado = userService.listarUsuarios();

        assertEquals(3, resultado.size());
        assertEquals("Ana Aluna", resultado.get(0).nome());
        assertEquals("ALUNO", resultado.get(0).perfil());
        assertEquals(20260001L, resultado.get(0).matricula());
        assertEquals("RESPONSAVEL", resultado.get(1).perfil());
        assertNull(resultado.get(1).matricula());
        assertEquals(11L, resultado.get(2).id());
        assertTrue(resultado.get(2).anonimizado());
        assertNull(resultado.get(2).nome());
    }
}
