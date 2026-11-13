package com.pfc.notus.nota.mapper;

import com.pfc.notus.boletim.domain.AnoLetivo;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.dto.NotaRequestDTO;
import com.pfc.notus.user.domain.Student;

public class NotaMapper {

    // REFN: converter DTO de entrada para entidade
    public static Nota toEntity(NotaRequestDTO dto, Student student, Disciplina disciplina) {
        Nota nota = new Nota(dto.descricao().trim(), dto.rate(), dto.bimestre());
        nota.setStudent(student);
        nota.setDisciplina(disciplina);
        nota.setAnoLetivo(AnoLetivo.doAluno(student));
        return nota;
    }

    // REFN: converter entidade para DTO de saída
    public static NotaDTO toDto(Nota nota) {
        return new NotaDTO(
                nota.getId(),
                nota.getDescricao(),
                nota.getRate(),
                nota.getBimestre(),
                nota.getStudent().getId(),
                nota.getDisciplina().getId(),
                nota.getDisciplina().getTitle());
    }
}
