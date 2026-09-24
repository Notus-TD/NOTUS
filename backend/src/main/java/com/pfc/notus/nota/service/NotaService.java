package com.pfc.notus.nota.service;

import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.repository.NotaRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotaService {

    @Autowired
    private NotaRepository notaRepository;

    @Autowired
    private BoletimRepository boletimRepository;

    @Autowired
    private DisiciplinaRepository disciplinaRepository;

    @Autowired
    private StudentAccessGuardService studentAccessGuardService;

    public List<Nota> getAllNota(){return notaRepository.findAll();}

    public List<Nota> getByBoletim(Long boletimId, String requesterEmail) {
        Boletim boletim = boletimRepository.findById(boletimId)
                .orElseThrow(() -> new EntityNotFoundException("Boletim não encontrado com o id: " + boletimId));
        studentAccessGuardService.assertCanView(boletim.getStudent().getId(), requesterEmail);
        return notaRepository.findByBoletimId(boletimId);
    }

    @Transactional
    public NotaDTO save(NotaDTO dto, String requesterEmail) {
        Boletim boletim = boletimRepository.findById(dto.boletimId())
                .orElseThrow(() -> new EntityNotFoundException("Boletim não encontrado com o id: " + dto.boletimId()));
        studentAccessGuardService.assertCanTeach(boletim.getStudent().getId(), dto.disciplinaId(), requesterEmail);
        Disciplina disciplina = disciplinaRepository.findById(dto.disciplinaId())
                .orElseThrow(() -> new EntityNotFoundException("Disciplina não encontrada com o id: " + dto.disciplinaId()));
        Nota entity = new Nota();
        entity.setRate(dto.rate());
        entity.setPeriod(dto.period());
        entity.setBoletim(boletim);
        entity.setDisciplina(disciplina);

        entity = notaRepository.save(entity);
        recalcularMedia(boletim.getId());
        return toDTO(entity);
    }

    @Transactional
    public NotaDTO update(Long id, NotaDTO dto, String requesterEmail) {
        Nota entity = notaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Nota não encontrada com o id: " + id));
        studentAccessGuardService.assertCanTeach(entity.getBoletim().getStudent().getId(), entity.getDisciplina().getId(), requesterEmail);
        Long boletimAntigoId = entity.getBoletim().getId();
        Boletim boletim = boletimRepository.findById(dto.boletimId())
                .orElseThrow(() -> new EntityNotFoundException("Boletim não encontrado com o id: " + dto.boletimId()));
        studentAccessGuardService.assertCanTeach(boletim.getStudent().getId(), dto.disciplinaId(), requesterEmail);
        Disciplina disciplina = disciplinaRepository.findById(dto.disciplinaId())
                .orElseThrow(() -> new EntityNotFoundException("Disciplina não encontrada com o id: " + dto.disciplinaId()));

        entity.setRate(dto.rate());
        entity.setPeriod(dto.period());
        entity.setBoletim(boletim);
        entity.setDisciplina(disciplina);

        entity = notaRepository.save(entity);
        recalcularMedia(boletim.getId());
        if (!boletimAntigoId.equals(boletim.getId())) {
            recalcularMedia(boletimAntigoId);
        }
        return toDTO(entity);
    }

    @Transactional
    public void delete(Long id, String requesterEmail) {
        Nota entity = notaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Nota não encontrada com o id: " + id));
        studentAccessGuardService.assertCanTeach(entity.getBoletim().getStudent().getId(), entity.getDisciplina().getId(), requesterEmail);
        Long boletimId = entity.getBoletim().getId();
        notaRepository.deleteById(id);
        recalcularMedia(boletimId);
    }

    /**
     * A média do boletim é a média das médias de cada matéria (não a média
     * bruta de todas as notas juntas), para que uma matéria com mais notas
     * lançadas não pese mais que as outras.
     */
    private void recalcularMedia(Long boletimId) {
        Boletim boletim = boletimRepository.findById(boletimId)
                .orElseThrow(() -> new EntityNotFoundException("Boletim não encontrado com o id: " + boletimId));
        List<Nota> notas = notaRepository.findByBoletimId(boletimId);

        List<Double> mediasPorDisciplina = notas.stream()
                .collect(Collectors.groupingBy(n -> n.getDisciplina().getId(), Collectors.averagingDouble(Nota::getRate)))
                .values()
                .stream()
                .collect(Collectors.toList());

        float media = (float) mediasPorDisciplina.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        boletim.setFinalAverage(media);
        boletimRepository.save(boletim);
    }

    private NotaDTO toDTO(Nota entity) {
        return new NotaDTO(entity.getId(), entity.getRate(), entity.getPeriod(), entity.getBoletim().getId(), entity.getDisciplina().getId());
    }
}
