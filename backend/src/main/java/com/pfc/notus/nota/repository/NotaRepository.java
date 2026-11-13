package com.pfc.notus.nota.repository;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.nota.domain.Nota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotaRepository extends JpaRepository<Nota, Long> {

    // REFN: buscar notas do aluno por ano letivo
    List<Nota> findByStudentIdAndAnoLetivoOrderByIdAsc(Long studentId, String anoLetivo);

    // REFN: buscar notas do aluno em disciplina/bimestre
    List<Nota> findByStudentIdAndDisciplinaIdAndBimestreAndAnoLetivo(Long studentId, Long disciplinaId, Bimestre bimestre, String anoLetivo);

    // REFN: calcular média do aluno em uma disciplina/bimestre
    @Query("SELECT AVG(n.rate) FROM Nota n " +
           "WHERE n.student.id = :studentId " +
           "AND n.disciplina.id = :disciplinaId " +
           "AND n.bimestre = :bimestre")
    Double getMediaDoAluno(Long studentId, Long disciplinaId, Bimestre bimestre);

    // REFN: calcular média da sala em uma disciplina/bimestre
    @Query("SELECT AVG(n.rate) FROM Nota n " +
           "WHERE n.disciplina.id = :disciplinaId " +
           "AND n.bimestre = :bimestre")
    Double getMediaDaSala(Long disciplinaId, Bimestre bimestre);
}
