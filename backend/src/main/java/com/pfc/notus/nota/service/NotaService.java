package com.pfc.notus.nota.service;

import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.domain.SituacaoBoletim;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.repository.NotaRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotaService {

    private static final float NOTA_MINIMA = 0f;
    private static final float NOTA_MAXIMA = 10f;

    @Autowired
    private NotaRepository notaRepository;

    @Autowired
    private BoletimRepository boletimRepository;

    @Autowired
    private DisiciplinaRepository disciplinaRepository;

    @Autowired
    private StudentAccessGuardService studentAccessGuardService;

    public List<Nota> getAllNota(){return notaRepository.findAll();}

    public NotaDTO getById(Long id, String requesterEmail) {
        Nota entity = notaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Nota não encontrada com o id: " + id));
        studentAccessGuardService.assertCanView(entity.getBoletim().getStudent().getId(), requesterEmail);
        return toDTO(entity);
    }

    public List<Nota> getByBoletim(Long boletimId, String requesterEmail) {
        Boletim boletim = boletimRepository.findById(boletimId)
                .orElseThrow(() -> new EntityNotFoundException("Boletim não encontrado com o id: " + boletimId));
        studentAccessGuardService.assertCanView(boletim.getStudent().getId(), requesterEmail);
        return notaRepository.findByBoletimId(boletimId);
    }

    public List<Nota> getByBoletimAndPeriod(Long boletimId, String period, String requesterEmail) {
        Boletim boletim = boletimRepository.findById(boletimId)
                .orElseThrow(() -> new EntityNotFoundException("Boletim não encontrado com o id: " + boletimId));
        studentAccessGuardService.assertCanView(boletim.getStudent().getId(), requesterEmail);
        return notaRepository.findByBoletimIdAndPeriod(boletimId, period);
    }

    public List<Nota> getByDisciplina(Long disciplinaId) {
        return notaRepository.findByDisciplinaId(disciplinaId);
    }

    public List<Nota> getByDisciplinaAndPeriod(Long disciplinaId, String period) {
        return notaRepository.findByDisciplinaIdAndPeriod(disciplinaId, period);
    }

    public Page<Nota> getByBoletimPaged(Long boletimId, String requesterEmail, Pageable pageable) {
        Boletim boletim = boletimRepository.findById(boletimId)
                .orElseThrow(() -> new EntityNotFoundException("Boletim não encontrado com o id: " + boletimId));
        studentAccessGuardService.assertCanView(boletim.getStudent().getId(), requesterEmail);
        return notaRepository.findByBoletimId(boletimId, pageable);
    }

    public Page<Nota> getByBoletimAndPeriodPaged(Long boletimId, String period, String requesterEmail, Pageable pageable) {
        Boletim boletim = boletimRepository.findById(boletimId)
                .orElseThrow(() -> new EntityNotFoundException("Boletim não encontrado com o id: " + boletimId));
        studentAccessGuardService.assertCanView(boletim.getStudent().getId(), requesterEmail);
        return notaRepository.findByBoletimIdAndPeriod(boletimId, period, pageable);
    }

    public Page<Nota> getByDisciplinaPaged(Long disciplinaId, Pageable pageable) {
        return notaRepository.findByDisciplinaId(disciplinaId, pageable);
    }

    public Page<Nota> getByDisciplinaAndPeriodPaged(Long disciplinaId, String period, Pageable pageable) {
        return notaRepository.findByDisciplinaIdAndPeriod(disciplinaId, period, pageable);
    }

    @Transactional
    public NotaDTO save(NotaDTO dto, String requesterEmail) {
        validarValorDaNota(dto.rate());
        Boletim boletim = boletimRepository.findById(dto.boletimId())
                .orElseThrow(() -> new EntityNotFoundException("Boletim não encontrado com o id: " + dto.boletimId()));
        studentAccessGuardService.assertCanTeach(boletim.getStudent().getId(), dto.disciplinaId(), requesterEmail);
        garantirBoletimAberto(boletim);
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
        validarValorDaNota(dto.rate());
        Nota entity = notaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Nota não encontrada com o id: " + id));
        // precisa poder lançar tanto na nota atual quanto no destino da alteração
        studentAccessGuardService.assertCanTeach(entity.getBoletim().getStudent().getId(), entity.getDisciplina().getId(), requesterEmail);
        Long boletimAntigoId = entity.getBoletim().getId();
        Boletim boletim = boletimRepository.findById(dto.boletimId())
                .orElseThrow(() -> new EntityNotFoundException("Boletim não encontrado com o id: " + dto.boletimId()));
        studentAccessGuardService.assertCanTeach(boletim.getStudent().getId(), dto.disciplinaId(), requesterEmail);
        // nem o boletim de origem nem o de destino podem estar fechados
        garantirBoletimAberto(entity.getBoletim());
        garantirBoletimAberto(boletim);
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
        garantirBoletimAberto(entity.getBoletim());
        Long boletimId = entity.getBoletim().getId();
        notaRepository.deleteById(id);
        recalcularMedia(boletimId);
    }

    private void validarValorDaNota(Float rate) {
        if (rate == null || rate.isNaN() || rate < NOTA_MINIMA || rate > NOTA_MAXIMA) {
            throw new RegraNegocioException("A nota deve estar entre 0 e 10.");
        }
    }

    private void garantirBoletimAberto(Boletim boletim) {
        if (boletim.getSituacao() == SituacaoBoletim.FECHADO) {
            throw new ConflictException("Boletim fechado: reabra o boletim para alterar as notas.");
        }
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
