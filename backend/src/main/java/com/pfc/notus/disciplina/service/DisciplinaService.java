package com.pfc.notus.disciplina.service;

import com.pfc.notus.disciplina.domain.AulaRegistro;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.dto.DisciplinaDTO;
import com.pfc.notus.disciplina.repository.AulaRegistroRepository;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class DisciplinaService {

    @Autowired
    private DisiciplinaRepository disciplinaRepository;

    @Autowired
    private AulaRegistroRepository aulaRegistroRepository;

    public List<Disciplina> getAllDisciplina() {
        return disciplinaRepository.findAll();
    }

    @Transactional
    public DisciplinaDTO save(DisciplinaDTO dto) {
        Disciplina entity = new Disciplina();
        entity.setTitle(dto.title());
        entity.setDescription(dto.description());
        entity.setCreated(dto.dueDate());

        entity = disciplinaRepository.save(entity);
        return new DisciplinaDTO(entity.getId(), entity.getTitle(), entity.getDescription(), entity.getCreated());
    }

    @Transactional
    public void delete(Long id) {
        if (!disciplinaRepository.existsById(id)) {
            throw new EntityNotFoundException("Disciplina não encontrado com o id: " + id);
        }
        disciplinaRepository.deleteById(id);
    }

    @Transactional
    public void registrarAula(Long disciplinaId, LocalDate data) {
        Disciplina disciplina = disciplinaRepository.findById(disciplinaId)
                .orElseThrow(() -> new EntityNotFoundException("Disciplina não encontrada com o id: " + disciplinaId));

        if (!aulaRegistroRepository.existsByDisciplinaIdAndData(disciplinaId, data)) {
            aulaRegistroRepository.save(new AulaRegistro(data, disciplina));
        }
    }
}