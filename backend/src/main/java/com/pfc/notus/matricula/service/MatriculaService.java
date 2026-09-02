package com.pfc.notus.matricula.service;


import com.pfc.notus.matricula.domain.Matricula;
import com.pfc.notus.matricula.dto.MatriculaDTO;
import com.pfc.notus.matricula.repository.MatriculaRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MatriculaService {

    @Autowired
    private MatriculaRepository matriculaRepository;

    public List<Matricula> getAllMatricula(){return matriculaRepository.findAll();}

    @Transactional
    public MatriculaDTO save (MatriculaDTO dto){
        Matricula entity = new Matricula();
        entity.setPeriod(dto.period());
        entity.setStatus(dto.status());
        entity.setFinalAverage(dto.finalAverage());

        entity =  matriculaRepository.save(entity);
        return new MatriculaDTO(entity.getId(), entity.getPeriod(), entity.getStatus(), entity.getFinalAverage());
    }

    @Transactional
    public void delete( Long id){
        if(matriculaRepository.existsById(id)){
           throw new EntityNotFoundException("Matricula não encontrado com o id: " +id);
        }
        matriculaRepository.deleteById(id);
    }
}
