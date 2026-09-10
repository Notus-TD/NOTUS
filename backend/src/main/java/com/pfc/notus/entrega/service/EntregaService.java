package com.pfc.notus.entrega.service;

import com.pfc.notus.atividade.domain.Atividade;
import com.pfc.notus.atividade.repository.AtividadeRepository;
import com.pfc.notus.entrega.domain.Entrega;
import com.pfc.notus.entrega.dto.EntregaDTO;
import com.pfc.notus.entrega.repository.EntregaRepository;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.StudentReposity;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EntregaService {

    @Autowired
    private EntregaRepository entregaRepository;

    @Autowired
    private AtividadeRepository atividadeRepository;

    @Autowired
    private StudentReposity studentRepository;

    public List<Entrega> getAllEntrega() {
        return entregaRepository.findAll();
    }

    public List<Entrega> getByStudent(Long studentId) {
        return entregaRepository.findByStudentId(studentId);
    }

    @Transactional
    public EntregaDTO save(EntregaDTO dto) {
        Atividade atividade = atividadeRepository.findById(dto.atividadeId())
                .orElseThrow(() -> new EntityNotFoundException("Atividade não encontrada com o id: " + dto.atividadeId()));
        Student student = studentRepository.findById(dto.studentId())
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado com o id: " + dto.studentId()));

        Entrega entity = new Entrega(dto.content(), dto.submittedAt(), dto.grade(), dto.status());
        entity.setAtividade(atividade);
        entity.setStudent(student);

        entity = entregaRepository.save(entity);
        return toDTO(entity);
    }

    @Transactional
    public void delete(Long id) {
        if (!entregaRepository.existsById(id)) {
            throw new EntityNotFoundException("Entrega não encontrada com o id: " + id);
        }
        entregaRepository.deleteById(id);
    }

    private EntregaDTO toDTO(Entrega entity) {
        return new EntregaDTO(
                entity.getId(),
                entity.getContent(),
                entity.getSubmittedAt(),
                entity.getGrade(),
                entity.getStatus(),
                entity.getAtividade().getId(),
                entity.getStudent().getId()
        );
    }
}
