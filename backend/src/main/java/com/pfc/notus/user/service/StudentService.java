package com.pfc.notus.user.service;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.dto.ResponsibleRequest;
import com.pfc.notus.user.dto.StudentMinDTO;
import com.pfc.notus.user.dto.StudentRegistrationResponse;
import com.pfc.notus.user.dto.StudentRequest;
import com.pfc.notus.user.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class StudentService {

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

    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudents() {
        return studentRepository.findAll().stream()
                .filter(s -> s.getAnonimizadoEm() == null)
                .map(s -> new StudentMinDTO(s.getId(), s.getMatricula(), s.getFullName(), s.getStatusMatricula()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudentsByTurmas(java.util.Collection<Long> turmaIds) {
        if (turmaIds.isEmpty()) return List.of();
        return studentRepository.findByTurmaIdIn(turmaIds).stream()
                .map(s -> new StudentMinDTO(s.getId(), s.getMatricula(), s.getFullName(), s.getStatusMatricula()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudentsByResponsible(Long responsibleId) {
        return studentRepository.findByResponsibleId(responsibleId).stream()
                .map(s -> new StudentMinDTO(s.getId(), s.getMatricula(), s.getFullName(), s.getStatusMatricula()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudentsByTurma(Long turmaId, String sort) {
        Sort ordenacao = "matricula".equalsIgnoreCase(sort) ? Sort.by("matricula") : Sort.by("fullName");
        return studentRepository.findByTurmaId(turmaId, ordenacao).stream()
                .map(s -> new StudentMinDTO(s.getId(), s.getMatricula(), s.getFullName(), s.getStatusMatricula()))
                .toList();
    }
}
