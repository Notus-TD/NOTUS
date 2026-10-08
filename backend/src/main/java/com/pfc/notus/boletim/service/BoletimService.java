package com.pfc.notus.boletim.service;


import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.domain.SituacaoBoletim;
import com.pfc.notus.boletim.dto.BoletimComNotasDTO;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.nota.dto.NotaDTO;
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

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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

    public List<Boletim> getByStudentAndPeriod(Long studentId, String period) {
        return boletimRepository.findByStudentIdAndPeriod(studentId, period);
    }

    public List<Boletim> getByPeriod(String period) {
        return boletimRepository.findByPeriod(period);
    }

    public Page<Boletim> getByStudentPaged(Long studentId, Pageable pageable) {
        return boletimRepository.findByStudentId(studentId, pageable);
    }

    public Page<Boletim> getByStudentAndPeriodPaged(Long studentId, String period, Pageable pageable) {
        return boletimRepository.findByStudentIdAndPeriod(studentId, period, pageable);
    }

    public Page<Boletim> getByPeriodPaged(String period, Pageable pageable) {
        return boletimRepository.findByPeriod(period, pageable);
    }

    public List<Boletim> getByStatus(String status) {
        return boletimRepository.findByStatus(status);
    }

    public Page<Boletim> getByStatusPaged(String status, Pageable pageable) {
        return boletimRepository.findByStatus(status, pageable);
    }

    public List<Boletim> getByStudentAndStatus(Long studentId, String status) {
        return boletimRepository.findByStudentIdAndStatus(studentId, status);
    }

    public Page<Boletim> getByStudentAndStatusPaged(Long studentId, String status, Pageable pageable) {
        return boletimRepository.findByStudentIdAndStatus(studentId, status, pageable);
    }

    public BoletimDTO getById(Long id) {
        Boletim entity = boletimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boletim não encontrado com o id: " + id));
        return toDTO(entity);
    }

    public BoletimComNotasDTO getByIdComNotas(Long id) {
        Boletim entity = boletimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boletim não encontrado com o id: " + id));
        return toDTOComNotas(entity);
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

    private BoletimComNotasDTO toDTOComNotas(Boletim entity) {
        var notas = entity.getNotas().stream()
                .map(n -> new NotaDTO(n.getId(), n.getRate(), n.getPeriod(), n.getBoletim().getId(), n.getDisciplina().getId()))
                .toList();
        return new BoletimComNotasDTO(entity.getId(), entity.getPeriod(), entity.getFinalAverage(), entity.getStatus(),
                entity.getStudent().getId(), entity.getSituacao(), entity.getFechadoEm(), notas);
    }
}
