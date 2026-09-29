package com.pfc.notus.turma.service;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.dto.TurmaAlunoRequestDTO;
import com.pfc.notus.turma.dto.TurmaAlunoResponseDTO;
import com.pfc.notus.turma.repository.TurmaRepository;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.repository.StudentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TurmaServiceUnitTest {

    @InjectMocks
    private TurmaService turmaService;

    @Mock
    private TurmaRepository turmaRepository;

    @Mock
    private StudentRepository studentRepository;

    private Turma criarTurma(Long id, String nome) {
        Turma turma = new Turma(nome, "2026");
        ReflectionTestUtils.setField(turma, "id", id);
        return turma;
    }

    private Student criarAluno(Long id) {
        Student aluno = new Student("Ana Aluna", "ana.aluna@notus.com", 20260001L, LocalDate.of(2012, 5, 10), null);
        ReflectionTestUtils.setField(aluno, "id", id);
        return aluno;
    }

    @DisplayName("Quando acessar método associarAluno")
    @Nested
    class AssociarAluno {

        @DisplayName("Quando executar com sucesso")
        @Nested
        class Sucesso {

            @DisplayName("Deve associar o aluno à turma e retornar o DTO correspondente")
            @Test
            void test1() {
                // dado
                var turma = criarTurma(1L, "9º Ano A");
                var aluno = criarAluno(2L);
                var dto = new TurmaAlunoRequestDTO(aluno.getId());

                when(turmaRepository.findById(turma.getId())).thenReturn(Optional.of(turma));
                when(studentRepository.findById(aluno.getId())).thenReturn(Optional.of(aluno));

                // quando
                TurmaAlunoResponseDTO resultado = turmaService.associarAluno(turma.getId(), dto);

                // entao
                assertThat(resultado.turmaId()).isEqualTo(turma.getId());
                assertThat(resultado.turmaName()).isEqualTo("9º Ano A");
                assertThat(resultado.studentId()).isEqualTo(aluno.getId());
                assertThat(resultado.studentName()).isEqualTo("Ana Aluna");
                assertThat(resultado.matricula()).isEqualTo(20260001L);
                assertThat(aluno.getTurma()).isEqualTo(turma);
                verify(studentRepository, times(1)).save(aluno);
            }
        }

        @DisplayName("Quando executar com falha")
        @Nested
        class Falha {

            @DisplayName("Quando a turma não existir, retornar ResourceNotFoundException")
            @Test
            void test2() {
                var dto = new TurmaAlunoRequestDTO(2L);
                when(turmaRepository.findById(1L)).thenReturn(Optional.empty());

                assertThatThrownBy(() -> turmaService.associarAluno(1L, dto))
                        .isInstanceOf(ResourceNotFoundException.class)
                        .hasMessageContaining("Turma não encontrada");

                verify(studentRepository, never()).save(any());
            }

            @DisplayName("Quando o aluno não existir, retornar ResourceNotFoundException")
            @Test
            void test3() {
                var turma = criarTurma(1L, "9º Ano A");
                var dto = new TurmaAlunoRequestDTO(2L);

                when(turmaRepository.findById(turma.getId())).thenReturn(Optional.of(turma));
                when(studentRepository.findById(dto.studentId())).thenReturn(Optional.empty());

                assertThatThrownBy(() -> turmaService.associarAluno(turma.getId(), dto))
                        .isInstanceOf(ResourceNotFoundException.class)
                        .hasMessageContaining("Aluno não encontrado");

                verify(studentRepository, never()).save(any());
            }

            @DisplayName("Quando a matrícula do aluno não estiver ativa, retornar ConflictException")
            @Test
            void test4() {
                var turma = criarTurma(1L, "9º Ano A");
                var aluno = criarAluno(2L);
                aluno.setStatusMatricula(StatusMatricula.FINALIZADA);
                var dto = new TurmaAlunoRequestDTO(aluno.getId());

                when(turmaRepository.findById(turma.getId())).thenReturn(Optional.of(turma));
                when(studentRepository.findById(aluno.getId())).thenReturn(Optional.of(aluno));

                assertThatThrownBy(() -> turmaService.associarAluno(turma.getId(), dto))
                        .isInstanceOf(ConflictException.class)
                        .hasMessageContaining("matrícula ativa");

                verify(studentRepository, never()).save(any());
            }

            @DisplayName("Quando o aluno já estiver em outra turma, retornar ConflictException")
            @Test
            void test5() {
                var turma = criarTurma(1L, "9º Ano A");
                var outraTurma = criarTurma(3L, "9º Ano B");
                var aluno = criarAluno(2L);
                aluno.setTurma(outraTurma);
                var dto = new TurmaAlunoRequestDTO(aluno.getId());

                when(turmaRepository.findById(turma.getId())).thenReturn(Optional.of(turma));
                when(studentRepository.findById(aluno.getId())).thenReturn(Optional.of(aluno));

                assertThatThrownBy(() -> turmaService.associarAluno(turma.getId(), dto))
                        .isInstanceOf(ConflictException.class)
                        .hasMessageContaining("9º Ano B");

                assertThat(aluno.getTurma()).isEqualTo(outraTurma);
                verify(studentRepository, never()).save(any());
            }

            @DisplayName("Quando o aluno já estiver nesta turma, retornar ConflictException")
            @Test
            void test6() {
                var turma = criarTurma(1L, "9º Ano A");
                var aluno = criarAluno(2L);
                aluno.setTurma(turma);
                var dto = new TurmaAlunoRequestDTO(aluno.getId());

                when(turmaRepository.findById(turma.getId())).thenReturn(Optional.of(turma));
                when(studentRepository.findById(aluno.getId())).thenReturn(Optional.of(aluno));

                assertThatThrownBy(() -> turmaService.associarAluno(turma.getId(), dto))
                        .isInstanceOf(ConflictException.class)
                        .hasMessageContaining("já está associado a esta turma");

                verify(studentRepository, never()).save(any());
            }
        }
    }
}
