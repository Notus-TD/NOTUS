package com.pfc.notus.atividade.service;


import com.pfc.notus.atividade.domain.Atividade;
import com.pfc.notus.atividade.dto.AtividadeDTO;
import com.pfc.notus.atividade.repository.AtividadeRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AtividadeService {

       @Autowired
    private AtividadeRepository atividadeRepository;

       public List<Atividade> getAllAtividade(){return atividadeRepository.findAll();}

    @Transactional
    public AtividadeDTO save(AtividadeDTO dto){
        Atividade entity = new Atividade();
        entity.setTitle(dto.title());
        entity.setContent(dto.content());
        entity.setStatus(dto.status());

        entity = atividadeRepository.save(entity);
        return new AtividadeDTO(entity.getId(), entity.getTitle(), entity.getContent(), entity.getStatus());
    }

    @Transactional
    public void delete(Long id){
        if (atividadeRepository.existsById(id)){
            throw new EntityNotFoundException("Atividade não encontrado com o id: " + id);
        }
        atividadeRepository.deleteById(id);
    }
}
