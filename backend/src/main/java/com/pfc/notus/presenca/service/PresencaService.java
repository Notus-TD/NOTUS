package com.pfc.notus.presenca.service;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.presenca.domain.Presenca;
import com.pfc.notus.presenca.dto.PresencaDTO;
import com.pfc.notus.presenca.repository.PresencaRepository;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PresencaService {

    @Autowired
    private PresencaRepository presencaRepository;

    @Autowired
    private DisiciplinaRepository disciplinaRepository;

    @Autowired
    private StudentRepository studentRepository;

    public List<Presenca> getAllPresenca() {
        return presencaRepository.findAll();
    }

    public List<Presenca> getByStudent(Long studentId) {
        return presencaRepository.findByStudentId(studentId);
    }

    @Transactional
    public PresencaDTO save(PresencaDTO dto) {
        Student student = studentRepository.findById(dto.studentId())
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado com o id: " + dto.studentId()));
        Disciplina disciplina = disciplinaRepository.findById(dto.disciplinaId())
                .orElseThrow(() -> new EntityNotFoundException("Disciplina não encontrada com o id: " + dto.disciplinaId()));

        Presenca entity = new Presenca(dto.date(), dto.status());
        entity.setStudent(student);
        entity.setDisciplina(disciplina);

        entity = presencaRepository.save(entity);
        return toDTO(entity);
    }

    @Transactional
    public void delete(Long id) {
        if (!presencaRepository.existsById(id)) {
            throw new EntityNotFoundException("Presença não encontrada com o id: " + id);
        }
        presencaRepository.deleteById(id);
    }

    private PresencaDTO toDTO(Presenca entity) {
        return new PresencaDTO(
                entity.getId(),
                entity.getDate(),
                entity.getStatus(),
                entity.getStudent().getId(),
                entity.getDisciplina().getId()
        );
    }
}
