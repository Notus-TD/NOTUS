package com.pfc.notus.boletim.service;


import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BoletimService {

    @Autowired
    private BoletimRepository boletimRepository;

    @Autowired
    private StudentRepository studentRepository;

    public List<Boletim> getAllBoletim() {
       return boletimRepository.findAll();

    }

    public List<Boletim> getByStudent(Long studentId) {
        return boletimRepository.findByStudentId(studentId);
    }

    @Transactional
    public Long getStudentId(Long boletimId) {
        return boletimRepository.findById(boletimId)
                .orElseThrow(() -> new EntityNotFoundException("Boletim não encontrado com o id: " + boletimId))
                .getStudent().getId();
    }

    @Transactional
    public BoletimDTO save(BoletimDTO dto) {
        Student student = studentRepository.findById(dto.studentId())
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado com o id: " + dto.studentId()));

        Boletim entity = new Boletim();
        entity.setPeriod(dto.period());
        entity.setFinalAverage(0f);
        entity.setStatus(dto.status());
        entity.setStudent(student);

        entity = boletimRepository.save(entity);
        return toDTO(entity);
    }

    @Transactional
    public void delete(Long id) {
        if (!boletimRepository.existsById(id)) {
            throw  new EntityNotFoundException("Boletim não encontrado com o id: " + id);
        }
        boletimRepository.deleteById(id);
    }

    private BoletimDTO toDTO(Boletim entity) {
        return new BoletimDTO(entity.getId(), entity.getPeriod(), entity.getFinalAverage(), entity.getStatus(), entity.getStudent().getId());
    }
}
