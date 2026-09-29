package com.pfc.notus.Service;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.lecionamento.domain.Lecionamento;
import com.pfc.notus.lecionamento.dto.LecionamentoDTO;
import com.pfc.notus.lecionamento.dto.LecionamentoRequestDTO;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.repository.TurmaRepository;
import com.pfc.notus.user.domain.Role;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LecionamentoServiceUnitTest {

    @InjectMocks
    private LecionamentoService lecionamentoService;

    @Mock
    private LecionamentoRepository lecionamentoRepository;

    @Mock
    private TurmaRepository turmaRepository;

    @Mock
    private DisiciplinaRepository disciplinaRepository;

    @Mock
    private UserRepository userRepository;

    private Turma criarTurma(Long id) {
        Turma turma = new Turma("3A", "2025");
        ReflectionTestUtils.setField(turma, "id", id);
        return turma;
    }

    private Disciplina criarDisciplina(Long id) {
        Disciplina disciplina = new Disciplina("Matemática", "Álgebra e geometria");
        ReflectionTestUtils.setField(disciplina, "id", id);
        return disciplina;
    }

    private User criarProfessor(Long id, boolean comRoleProfessor) {
        User professor = new User("professor@notus.com");
        ReflectionTestUtils.setField(professor, "id", id);
        if (comRoleProfessor) {
            professor.addRole(new Role(1L, "ROLE_PROFESSOR"));
        }
        return professor;
    }

    @DisplayName("Quando acessar método create")
    @Nested
    class Create {

        @DisplayName("Quando executar com sucesso")
        @Nested
        class Sucesso {

            @DisplayName("Deve criar o vínculo e retornar o DTO correspondente")
            @Test
            void test1() {
                // dado
                var turma = criarTurma(1L);
                var disciplina = criarDisciplina(2L);
                var professor = criarProfessor(3L, true);
                var dto = new LecionamentoRequestDTO(turma.getId(), disciplina.getId(), professor.getId());

                when(turmaRepository.findById(turma.getId())).thenReturn(Optional.of(turma));
                when(disciplinaRepository.findById(disciplina.getId())).thenReturn(Optional.of(disciplina));
                when(userRepository.findById(professor.getId())).thenReturn(Optional.of(professor));
                when(lecionamentoRepository.existsByTurmaIdAndDisciplinaIdAndProfessorId(
                        turma.getId(), disciplina.getId(), professor.getId())).thenReturn(false);
                when(lecionamentoRepository.existsByProfessorIdAndDisciplinaIdNot(
                        professor.getId(), disciplina.getId())).thenReturn(false);

                var entitySalva = new Lecionamento(turma, disciplina, professor);
                ReflectionTestUtils.setField(entitySalva, "id", 10L);
                when(lecionamentoRepository.save(any(Lecionamento.class))).thenReturn(entitySalva);

                // quando
                LecionamentoDTO resultado = lecionamentoService.create(dto);

                // entao
                assertThat(resultado.id()).isEqualTo(10L);
                assertThat(resultado.turmaId()).isEqualTo(turma.getId());
                assertThat(resultado.disciplinaId()).isEqualTo(disciplina.getId());
                assertThat(resultado.professorId()).isEqualTo(professor.getId());
                verify(lecionamentoRepository, times(1)).save(any(Lecionamento.class));
            }
        }

        @DisplayName("Quando executar com falha")
        @Nested
        class Falha {

            @DisplayName("Quando a turma não existir, retornar ResourceNotFoundException")
            @Test
            void test2() {
                var dto = new LecionamentoRequestDTO(1L, 2L, 3L);
                when(turmaRepository.findById(dto.turmaId())).thenReturn(Optional.empty());

                assertThatThrownBy(() -> lecionamentoService.create(dto))
                        .isInstanceOf(ResourceNotFoundException.class)
                        .hasMessageContaining("Turma não encontrada");

                verify(lecionamentoRepository, never()).save(any());
            }

            @DisplayName("Quando o professor informado não possuir o papel de professor, retornar ConflictException")
            @Test
            void test3() {
                var turma = criarTurma(1L);
                var disciplina = criarDisciplina(2L);
                var usuarioSemRole = criarProfessor(3L, false);
                var dto = new LecionamentoRequestDTO(turma.getId(), disciplina.getId(), usuarioSemRole.getId());

                when(turmaRepository.findById(turma.getId())).thenReturn(Optional.of(turma));
                when(disciplinaRepository.findById(disciplina.getId())).thenReturn(Optional.of(disciplina));
                when(userRepository.findById(usuarioSemRole.getId())).thenReturn(Optional.of(usuarioSemRole));

                assertThatThrownBy(() -> lecionamentoService.create(dto))
                        .isInstanceOf(ConflictException.class)
                        .hasMessageContaining("não é um professor");

                verify(lecionamentoRepository, never()).save(any());
            }

            @DisplayName("Quando o vínculo já existir para a turma, disciplina e professor, retornar ConflictException")
            @Test
            void test4() {
                var turma = criarTurma(1L);
                var disciplina = criarDisciplina(2L);
                var professor = criarProfessor(3L, true);
                var dto = new LecionamentoRequestDTO(turma.getId(), disciplina.getId(), professor.getId());

                when(turmaRepository.findById(turma.getId())).thenReturn(Optional.of(turma));
                when(disciplinaRepository.findById(disciplina.getId())).thenReturn(Optional.of(disciplina));
                when(userRepository.findById(professor.getId())).thenReturn(Optional.of(professor));
                when(lecionamentoRepository.existsByTurmaIdAndDisciplinaIdAndProfessorId(
                        turma.getId(), disciplina.getId(), professor.getId())).thenReturn(true);

                assertThatThrownBy(() -> lecionamentoService.create(dto))
                        .isInstanceOf(ConflictException.class)
                        .hasMessageContaining("já está associado");

                verify(lecionamentoRepository, never()).save(any());
            }

            @DisplayName("Quando o professor já lecionar outra disciplina, retornar ConflictException")
            @Test
            void test5() {
                var turma = criarTurma(1L);
                var disciplina = criarDisciplina(2L);
                var professor = criarProfessor(3L, true);
                var dto = new LecionamentoRequestDTO(turma.getId(), disciplina.getId(), professor.getId());

                when(turmaRepository.findById(turma.getId())).thenReturn(Optional.of(turma));
                when(disciplinaRepository.findById(disciplina.getId())).thenReturn(Optional.of(disciplina));
                when(userRepository.findById(professor.getId())).thenReturn(Optional.of(professor));
                when(lecionamentoRepository.existsByTurmaIdAndDisciplinaIdAndProfessorId(
                        turma.getId(), disciplina.getId(), professor.getId())).thenReturn(false);
                when(lecionamentoRepository.existsByProfessorIdAndDisciplinaIdNot(
                        professor.getId(), disciplina.getId())).thenReturn(true);

                assertThatThrownBy(() -> lecionamentoService.create(dto))
                        .isInstanceOf(ConflictException.class)
                        .hasMessageContaining("única disciplina");

                verify(lecionamentoRepository, never()).save(any());
            }
        }
    }

    @DisplayName("Quando acessar método delete")
    @Nested
    class Delete {

        @DisplayName("Quando executar com sucesso, deve remover o vínculo existente")
        @Test
        void test1() {
            when(lecionamentoRepository.existsById(1L)).thenReturn(true);

            lecionamentoService.delete(1L);

            verify(lecionamentoRepository, times(1)).deleteById(1L);
        }

        @DisplayName("Quando o vínculo não existir, retornar ResourceNotFoundException")
        @Test
        void test2() {
            when(lecionamentoRepository.existsById(99L)).thenReturn(false);

            assertThatThrownBy(() -> lecionamentoService.delete(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Vínculo não encontrado");

            verify(lecionamentoRepository, never()).deleteById(any());
        }
    }
}
