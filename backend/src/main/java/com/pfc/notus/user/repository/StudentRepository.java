package com.pfc.notus.user.repository;

import com.pfc.notus.user.domain.Student;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {


    Optional<Object> findByMatricula(@NotNull Long matricula);

    List<Student> findByResponsibleId(Long responsibleId);

    List<Student> findByTurmaId(Long turmaId, Sort sort);

    List<Student> findByTurmaIdIn(Collection<Long> turmaIds);
}
