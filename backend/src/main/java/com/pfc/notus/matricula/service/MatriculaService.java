package com.pfc.notus.matricula.service;


import com.pfc.notus.matricula.domain.Matricula;
import com.pfc.notus.matricula.repository.MatriculaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MatriculaService {

    @Autowired
    private MatriculaRepository matriculaRepository;

    public List<Matricula> getAllMatricula(){return matriculaRepository.findAll();}
}
