package com.pfc.notus.matricula.service;


import com.pfc.notus.matricula.domain.Matricula;
import com.pfc.notus.matricula.dto.MatriculaRequestDTO;
import com.pfc.notus.matricula.dto.MatriculaResponseDTO;
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
    public MatriculaResponseDTO save (MatriculaRequestDTO dto){
        Student student = studentReposity.findById(dto.userId())
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado com o id: " + dto.userId()));

        Matricula matricula = new Matricula(student);
        matricula = matriculaRepository.save(matricula);

        return new MatriculaResponseDTO(matricula.getStatus(), student.getId());
    }

    @Transactional
    public Matricula create(Student student) {
        return matriculaRepository.save(new Matricula(student));
    }

    @Transactional
    public void delete( Long id){
        if(!matriculaRepository.existsById(id)){
           throw new EntityNotFoundException("Matricula não encontrado com o id: " +id);
        }
        matriculaRepository.deleteById(id);
    }
}
