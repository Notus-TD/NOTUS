package com.pfc.notus.user.repository;

import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

// ! REFU: Acesso ao banco da tabela tb_student
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {


    // ! REFU: aluno pela matrícula (checa duplicidade no cadastro)
    Optional<Object> findByMatricula(@NotNull Long matricula);

    // ! REFU: outro aluno já usa essa matrícula? (update)
    boolean existsByMatriculaAndIdNot(Long matricula, Long id);

    // ! REFU: filhos de um responsável
    List<Student> findByResponsibleId(Long responsibleId);

    // ! REFU: alunos de uma turma com a ordenação pedida
    List<Student> findByTurmaId(Long turmaId, Sort sort);

    // ! REFU: alunos de várias turmas
    List<Student> findByTurmaIdIn(Collection<Long> turmaIds);

    // ! REFU: o responsável tem filho com esse status? (bloqueia anonimização se tiver ativo)
    boolean existsByResponsibleIdAndStatusMatricula(Long responsibleId, StatusMatricula statusMatricula);
}
