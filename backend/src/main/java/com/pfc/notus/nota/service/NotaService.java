package com.pfc.notus.nota.service;

import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.repository.NotaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotaService {

    @Autowired
    private NotaRepository notaRepository;

    public List<NotaDTO> getAllNota(){
        return notaRepository.findAll().stream().map(x -> new NotaDTO(x)).toList();
    }
}
