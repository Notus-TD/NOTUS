package com.pfc.notus.falta.repository;

import com.pfc.notus.falta.domain.FaltaDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

// ! REFF: Acesso ao banco da tabela tb_falta
@Repository
public interface FaltaRepository extends JpaRepository<FaltaDomain, Long> {

    // ! REFF: faltas de um aluno em um ano letivo
    List<FaltaDomain> findByAlunoIdAndAnoLetivo(Long alunoId, String anoLetivo);

    // ! REFF: faltas de vários alunos em um ano letivo
    List<FaltaDomain> findByAlunoIdInAndAnoLetivo(List<Long> alunoIds, String anoLetivo);

    // ! REFF: faltas de uma disciplina em um ano letivo
    List<FaltaDomain> findByDisciplinaIdAndAnoLetivo(Long disciplinaId, String anoLetivo);

    // ! REFF: faltas de vários alunos na disciplina em um dia (usado na chamada)
    List<FaltaDomain> findByAlunoIdInAndDisciplinaIdAndData(Collection<Long> alunoIds, Long disciplinaId, LocalDate data);

    // ! REFF: faltas de vários alunos na disciplina no ano (total da chamada)
    List<FaltaDomain> findByAlunoIdInAndDisciplinaIdAndAnoLetivo(Collection<Long> alunoIds, Long disciplinaId, String anoLetivo);

    // ! REFF: quantas faltas o aluno tem (usado para checar se pode ser excluído)
    long countByAlunoId(Long alunoId);
}
