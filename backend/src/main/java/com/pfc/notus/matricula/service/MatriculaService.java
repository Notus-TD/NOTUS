package com.pfc.notus.matricula.service;


import com.pfc.notus.matricula.domain.Matricula;
import com.pfc.notus.matricula.domain.StatusMatricula;
import com.pfc.notus.matricula.dto.MatriculaDTO;
import com.pfc.notus.matricula.repository.MatriculaRepository;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.StudentReposity;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MatriculaService {

    @Autowired
    private MatriculaRepository matriculaRepository;

    @Autowired
    private StudentReposity studentReposity;

    public List<Matricula> getAllMatricula(){return matriculaRepository.findAll();}

    @Transactional
    public MatriculaDTO save (MatriculaDTO dto){
        Student student = studentReposity.findById(dto.userId())
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado com o id: " + dto.userId()));

        Matricula entity = new Matricula(student, dto.period(), StatusMatricula.ATIVA);
        entity = matriculaRepository.save(entity);

        return new MatriculaDTO(entity.getId(), entity.getPeriod(), entity.getStatus(), student.getId());
    }

    @Transactional
    public void delete( Long id){
        if(!matriculaRepository.existsById(id)){
           throw new EntityNotFoundException("Matricula não encontrado com o id: " +id);
        }
        matriculaRepository.deleteById(id);
    }
}
