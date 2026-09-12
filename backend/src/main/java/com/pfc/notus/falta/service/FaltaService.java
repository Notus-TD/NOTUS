package com.pfc.notus.falta.service;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.falta.domain.FaltaDomain;
import com.pfc.notus.falta.dto.FaltaDTO;
import com.pfc.notus.falta.repository.FaltaRepository;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FaltaService {

    @Autowired
    private FaltaRepository faltaRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DisiciplinaRepository disciplinaRepository;

    @Autowired
    private UserRepository userRepository;

    public List<FaltaDTO> getAllFaltas() {
        return faltaRepository.findAll().stream().map(this::toDTO).toList();
    }

    public List<FaltaDTO> getByStudent(Long studentId) {
        return faltaRepository.findByAlunoId(studentId).stream().map(this::toDTO).toList();
    }

    @Transactional
    public FaltaDTO associarFalta(FaltaDTO dto) {
        Student aluno = studentRepository.findById(dto.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + dto.studentId()));
        Disciplina disciplina = disciplinaRepository.findById(dto.disciplinaId())
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + dto.disciplinaId()));
        User registradoPor = userRepository.findById(dto.registradoPorId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + dto.registradoPorId()));

        FaltaDomain entity = new FaltaDomain(dto.quantidade(), dto.data(), LocalDateTime.now(), aluno, registradoPor, disciplina);

        entity = faltaRepository.save(entity);
        return toDTO(entity);
    }

    @Transactional
    public void delete(Long id) {
        if (!faltaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Falta não encontrada com o id: " + id);
        }
        faltaRepository.deleteById(id);
    }

    private FaltaDTO toDTO(FaltaDomain entity) {
        return new FaltaDTO(
                entity.getId(),
                entity.getData(),
                entity.getQuantidade(),
                entity.getRegistradoEm(),
                entity.getAluno().getId(),
                entity.getDisciplina().getId(),
                entity.getRegistradoPor().getId()
        );
    }
}
