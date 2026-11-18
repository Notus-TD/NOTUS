package com.pfc.notus.disciplina.repository;

import com.pfc.notus.disciplina.domain.Disciplina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// ! REFD: Acesso ao banco da tabela tb_disciplina
@Repository
public interface DisciplinaRepository extends JpaRepository<Disciplina, Long> {

    // ! REFD: já existe disciplina com esse nome? (usado no create)
    boolean existsByTitleIgnoreCase(String title);

    // ! REFD: outra disciplina (id diferente) já usa esse nome? (usado no update)
    boolean existsByTitleIgnoreCaseAndIdNot(String title, Long id);
}
