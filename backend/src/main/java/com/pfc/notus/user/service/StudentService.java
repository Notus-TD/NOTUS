package com.pfc.notus.user.service;

import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.dto.ReativacaoAlunoRequest;
import com.pfc.notus.user.dto.ResponsibleRequest;
import com.pfc.notus.user.dto.StudentMinDTO;
import com.pfc.notus.user.dto.StudentRegistrationResponse;
import com.pfc.notus.user.dto.StudentRequest;
import com.pfc.notus.user.repository.StudentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class StudentService {

    private static final Logger log = LoggerFactory.getLogger(StudentService.class);

    @Autowired
    private UserService userService;

    @Autowired
    private ResponsibleService responsibleService;

    @Autowired
    private StudentRepository studentRepository;

    @Transactional
    public StudentRegistrationResponse createStudent(ResponsibleRequest responsibleDto, StudentRequest studentDto) {
        if (studentRepository.findByMatricula(studentDto.matricula()).isPresent()) {
            throw new ConflictException("Matrícula já cadastrada: " + studentDto.matricula());
        }

        Responsible responsible = responsibleService.findOrCreateResponsible(responsibleDto);

        Student student = new Student(
                studentDto.fullName(), studentDto.educationalEmail(), studentDto.matricula(),
                studentDto.birthDate(), responsible);

        student = (Student) userService.register(student, "ROLE_ALUNO");

        return new StudentRegistrationResponse(student.getId(), student.getFullName());
    }

    // Tudo ou nada: se um aluno falhar, nenhum do lote fica cadastrado.
    @Transactional
    public List<StudentRegistrationResponse> createStudents(ResponsibleRequest responsibleDto, List<StudentRequest> studentDtos) {
        Set<Long> matriculas = new HashSet<>();
        Set<String> emails = new HashSet<>();
        for (StudentRequest dto : studentDtos) {
            if (!matriculas.add(dto.matricula())) {
                throw new ConflictException("Matrícula repetida no cadastro: " + dto.matricula());
            }
            if (!emails.add(dto.educationalEmail().trim().toLowerCase())) {
                throw new ConflictException("E-mail repetido no cadastro: " + dto.educationalEmail());
            }
        }

        return studentDtos.stream()
                .map(dto -> createStudent(responsibleDto, dto))
                .toList();
    }

    /**
     * Reativa um aluno anonimizado que voltou para a escola: recebe nome, nascimento, e-mail e
     * responsável de novo, a matrícula volta a ficar ativa e as notas e faltas antigas continuam ligadas a ele.
     * A turma fica vazia, para a secretaria escolher.
     */
    @Transactional
    public void reativar(Long studentId, ReativacaoAlunoRequest dto, String requesterEmail) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado: " + studentId));
        if (student.getAnonimizadoEm() == null) {
            throw new ConflictException("Este aluno não está anonimizado.");
        }
        if (dto.educationalEmail().trim().equalsIgnoreCase(dto.responsible().email().trim())) {
            throw new RegraNegocioException("O e-mail do aluno deve ser diferente do e-mail do responsável.");
        }

        Responsible responsible = responsibleService.findOrCreateResponsible(dto.responsible());
        student.setFullName(dto.fullName().trim());
        student.setBirthDate(dto.birthDate());
        student.setResponsible(responsible);
        student.setStatusMatricula(StatusMatricula.ATIVA);
        userService.reativar(student, dto.educationalEmail());
        log.info(AuditMarker.AUDIT, "Aluno {} reativado por {}", student.getId(), requesterEmail);
    }

    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudents() {
        return studentRepository.findAll().stream()
                .map(StudentMinDTO::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudentsByTurmas(java.util.Collection<Long> turmaIds) {
        if (turmaIds.isEmpty()) return List.of();
        return studentRepository.findByTurmaIdIn(turmaIds).stream()
                .map(StudentMinDTO::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudentsByResponsible(Long responsibleId) {
        return studentRepository.findByResponsibleId(responsibleId).stream()
                .map(StudentMinDTO::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudentsByTurma(Long turmaId, String sort) {
        Sort ordenacao = "matricula".equalsIgnoreCase(sort) ? Sort.by("matricula") : Sort.by("fullName");
        return studentRepository.findByTurmaId(turmaId, ordenacao).stream()
                .map(StudentMinDTO::of)
                .toList();
    }
}
