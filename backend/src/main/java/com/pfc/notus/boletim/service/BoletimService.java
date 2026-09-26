package com.pfc.notus.boletim.service;


import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.domain.SituacaoBoletim;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.notificacao.event.BoletimFechadoEvent;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BoletimService {

    @Autowired
    private BoletimRepository boletimRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

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
        entity.setSituacao(SituacaoBoletim.ABERTO);
        entity.setStudent(student);

        entity = boletimRepository.save(entity);
        return toDTO(entity);
    }

    @Transactional
    public BoletimDTO fechar(Long id) {
        Boletim entity = boletimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boletim não encontrado com o id: " + id));
        if (entity.getSituacao() == SituacaoBoletim.FECHADO) {
            throw new ConflictException("Boletim já está fechado");
        }
        entity.setSituacao(SituacaoBoletim.FECHADO);
        entity.setFechadoEm(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        entity = boletimRepository.save(entity);

        // A notificação é criada só depois do commit (NotificacaoListener): um erro nela não desfaz o fechamento.
        eventPublisher.publishEvent(new BoletimFechadoEvent(entity.getId()));
        return toDTO(entity);
    }

    @Transactional
    public BoletimDTO reabrir(Long id) {
        Boletim entity = boletimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boletim não encontrado com o id: " + id));
        if (entity.getSituacao() != SituacaoBoletim.FECHADO) {
            throw new ConflictException("Boletim já está aberto");
        }
        entity.setSituacao(SituacaoBoletim.ABERTO);
        entity.setFechadoEm(null);
        return toDTO(boletimRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!boletimRepository.existsById(id)) {
            throw  new EntityNotFoundException("Boletim não encontrado com o id: " + id);
        }
        boletimRepository.deleteById(id);
    }

    private BoletimDTO toDTO(Boletim entity) {
        return new BoletimDTO(entity.getId(), entity.getPeriod(), entity.getFinalAverage(), entity.getStatus(), entity.getStudent().getId(),
                entity.getSituacao(), entity.getFechadoEm());
    }
}
