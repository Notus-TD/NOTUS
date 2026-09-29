package com.pfc.notus.turma.service;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.dto.TurmaAlunoRequestDTO;
import com.pfc.notus.turma.dto.TurmaAlunoResponseDTO;
import com.pfc.notus.turma.repository.TurmaRepository;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TurmaService {

    @Autowired
    private TurmaRepository turmaRepository;

    @Autowired
    private StudentRepository studentRepository;

    public List<Turma> getAllTurma() {return turmaRepository.findAll();}

    @Transactional
    public TurmaAlunoResponseDTO associarAluno(Long turmaId, TurmaAlunoRequestDTO dto) {
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada com o id: " + turmaId));
        Student student = studentRepository.findById(dto.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + dto.studentId()));

        if (student.getStatusMatricula() != StatusMatricula.ATIVA) {
            throw new ConflictException("O aluno não possui matrícula ativa.");
        }
        if (student.getTurma() != null) {
            if (student.getTurma().getId().equals(turma.getId())) {
                throw new ConflictException("O aluno já está associado a esta turma.");
            }
            throw new ConflictException("O aluno já está associado à turma " + student.getTurma().getName() + ".");
        }

        student.setTurma(turma);
        studentRepository.save(student);

        return new TurmaAlunoResponseDTO(
                turma.getId(),
                turma.getName(),
                student.getId(),
                student.getFullName(),
                student.getMatricula()
        );
    }
}
