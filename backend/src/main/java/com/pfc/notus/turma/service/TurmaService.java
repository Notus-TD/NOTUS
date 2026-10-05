package com.pfc.notus.turma.service;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.lecionamento.domain.Lecionamento;
import com.pfc.notus.lecionamento.dto.LecionamentoDTO;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.dto.TurmaAlunoRequestDTO;
import com.pfc.notus.turma.dto.TurmaAlunoResponseDTO;
import com.pfc.notus.turma.dto.TurmaDTO;
import com.pfc.notus.turma.dto.TurmaDetalheDTO;
import com.pfc.notus.turma.dto.TurmaRequestDTO;
import com.pfc.notus.turma.repository.TurmaRepository;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.dto.StudentMinDTO;
import com.pfc.notus.user.repository.StudentRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class TurmaService {

    private final TurmaRepository turmaRepository;
    private final StudentRepository studentRepository;

    public TurmaService(TurmaRepository turmaRepository, StudentRepository studentRepository) {
        this.turmaRepository = turmaRepository;
        this.studentRepository = studentRepository;
    }

    @Transactional(readOnly = true)
    public List<TurmaDTO> getAllTurma() {
        return turmaRepository.findAll(Sort.by("schoolYear", "name")).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public TurmaDetalheDTO getById(Long turmaId) {
        Turma turma = buscarTurma(turmaId);

        List<StudentMinDTO> alunos = turma.getAlunos().stream()
                .sorted(Comparator.comparing(Student::getFullName, String.CASE_INSENSITIVE_ORDER))
                .map(s -> new StudentMinDTO(s.getId(), s.getMatricula(), s.getFullName(), s.getStatusMatricula()))
                .toList();

        List<LecionamentoDTO> lecionamentos = turma.getLecionamentos().stream()
                .map(this::toLecionamentoDTO)
                .toList();

        return new TurmaDetalheDTO(turma.getId(), turma.getName(), turma.getSchoolYear(), alunos, lecionamentos);
    }

    @Transactional
    public TurmaDTO create(TurmaRequestDTO dto) {
        String name = dto.name().trim();
        String schoolYear = dto.schoolYear().trim();

        if (turmaRepository.existsByNameAndSchoolYear(name, schoolYear)) {
            throw new ConflictException("Já existe a turma " + name + " no ano letivo " + schoolYear + ".");
        }

        Turma turma = turmaRepository.save(new Turma(name, schoolYear));
        return toDTO(turma);
    }

    @Transactional
    public TurmaDTO update(Long turmaId, TurmaRequestDTO dto) {
        Turma turma = buscarTurma(turmaId);
        String name = dto.name().trim();
        String schoolYear = dto.schoolYear().trim();

        if (turmaRepository.existsByNameAndSchoolYearAndIdNot(name, schoolYear, turmaId)) {
            throw new ConflictException("Já existe a turma " + name + " no ano letivo " + schoolYear + ".");
        }

        turma.setName(name);
        turma.setSchoolYear(schoolYear);
        return toDTO(turmaRepository.save(turma));
    }

    @Transactional
    public void delete(Long turmaId) {
        Turma turma = buscarTurma(turmaId);

        if (!turma.getAlunos().isEmpty()) {
            throw new ConflictException("A turma possui alunos associados. Remova os alunos antes de excluí-la.");
        }
        if (!turma.getLecionamentos().isEmpty()) {
            throw new ConflictException("A turma possui professores associados. Remova os vínculos antes de excluí-la.");
        }

        turmaRepository.delete(turma);
    }

    @Transactional
    public TurmaAlunoResponseDTO associarAluno(Long turmaId, TurmaAlunoRequestDTO dto) {
        Turma turma = buscarTurma(turmaId);
        Student student = buscarAluno(dto.studentId());

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

    @Transactional
    public void removerAluno(Long turmaId, Long studentId) {
        Turma turma = buscarTurma(turmaId);
        Student student = buscarAluno(studentId);

        if (student.getTurma() == null || !student.getTurma().getId().equals(turma.getId())) {
            throw new ConflictException("O aluno não está associado a esta turma.");
        }

        student.setTurma(null);
        studentRepository.save(student);
    }

    private Turma buscarTurma(Long turmaId) {
        return turmaRepository.findById(turmaId)
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada com o id: " + turmaId));
    }

    private Student buscarAluno(Long studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId));
    }

    private TurmaDTO toDTO(Turma turma) {
        return new TurmaDTO(turma.getId(), turma.getName(), turma.getSchoolYear(), turma.getAlunos().size());
    }

    private LecionamentoDTO toLecionamentoDTO(Lecionamento lecionamento) {
        return new LecionamentoDTO(
                lecionamento.getId(),
                lecionamento.getTurma().getId(),
                lecionamento.getTurma().getName(),
                lecionamento.getDisciplina().getId(),
                lecionamento.getDisciplina().getTitle(),
                lecionamento.getProfessor().getId(),
                lecionamento.getProfessor().getEmail()
        );
    }
}
