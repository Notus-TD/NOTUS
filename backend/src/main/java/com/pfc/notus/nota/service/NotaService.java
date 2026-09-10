package com.pfc.notus.nota.service;

import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.repository.NotaRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotaService {

    @Autowired
    private NotaRepository notaRepository;

    @Autowired
    private BoletimRepository boletimRepository;

    public List<Nota> getAllNota(){return notaRepository.findAll();}

    @Transactional
    public NotaDTO save(NotaDTO dto) {
        Boletim boletim = boletimRepository.findById(dto.boletimId())
                .orElseThrow(() -> new EntityNotFoundException("Boletim não encontrado com o id: " + dto.boletimId()));
        Nota entity = new Nota();
        entity.setRate(dto.rate());
        entity.setPeriod(dto.period());
        entity.setBoletim(boletim);

        entity = notaRepository.save(entity);
        return new NotaDTO(entity.getId(), entity.getRate(), entity.getPeriod(), entity.getBoletim().getId());
    }

    @Transactional
    public void delete(Long id) {
        if (!notaRepository.existsById(id)) {
            throw new EntityNotFoundException("Nota não encontrada com o id: " + id);
        }
        notaRepository.deleteById(id);
    }
}
