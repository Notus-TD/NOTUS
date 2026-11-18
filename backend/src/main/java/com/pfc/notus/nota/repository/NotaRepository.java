package com.pfc.notus.nota.repository;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.nota.domain.Nota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// ! REFNO: Acesso ao banco da tabela tb_nota (notas de avaliação)
@Repository
public interface NotaRepository extends JpaRepository<Nota, Long> {

    // ! REFNO: notas do aluno no ano, na ordem em que foram lançadas
    List<Nota> findByStudentIdAndAnoLetivoOrderByIdAsc(Long studentId, String anoLetivo);

    // ! REFNO: notas de uma disciplina em um bimestre (para calcular a média no boletim)
    List<Nota> findByStudentIdAndDisciplinaIdAndBimestreAndAnoLetivo(Long studentId, Long disciplinaId, Bimestre bimestre, String anoLetivo);
}
