package com.pfc.notus.boletim.repository;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.boletim.domain.Boletim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// ! REFB: Acesso ao banco da tabela tb_boletim (notas finais)
@Repository
public interface BoletimRepository extends JpaRepository<Boletim, Long> {

    // ! REFB: todas as notas finais do aluno em um ano letivo
    List<Boletim> findByStudentIdAndAnoLetivo(Long studentId, String anoLetivo);

    // ! REFB: nota final de uma disciplina em um bimestre (é única por aluno+disciplina+bimestre+ano)
    Optional<Boletim> findByStudentIdAndDisciplinaIdAndBimestreAndAnoLetivo(Long studentId, Long disciplinaId, Bimestre bimestre, String anoLetivo);

    // ! REFB: quantas notas finais o aluno tem (usado para checar se pode ser excluído)
    long countByStudentId(Long studentId);
}
