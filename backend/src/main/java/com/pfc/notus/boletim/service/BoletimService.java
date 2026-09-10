package com.pfc.notus.boletim.service;


import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.repository.BoletimRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BoletimService {

    @Autowired
    private BoletimRepository boletimRepository;

    public List<Boletim> getAllBoletim() {
       return boletimRepository.findAll();

    }

    @Transactional
    public BoletimDTO save(BoletimDTO dto) {
        Boletim entity = new Boletim();
        entity.setPeriod(dto.period());
        entity.setFinalAverage(dto.finalAverage());
        entity.setStatus(dto.status());

        entity = boletimRepository.save(entity);
        return new BoletimDTO(entity.getId(), entity.getPeriod(), entity.getFinalAverage(), entity.getStatus());
    }

    @Transactional
    public void delete(Long id) {
        if (!boletimRepository.existsById(id)) {
            throw  new EntityNotFoundException("Boletim não encontrado com o id: " + id);
        }
        boletimRepository.deleteById(id);
    }
}
