package com.pfc.notus.user.service;

import com.pfc.notus.matricula.domain.Matricula;
import com.pfc.notus.matricula.service.MatriculaService;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.dto.ResponsibleRequest;
import com.pfc.notus.user.dto.StudentRegistrationResponse;
import com.pfc.notus.user.dto.StudentRequest;
import com.pfc.notus.user.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentService {

    @Autowired
    private UserService userService;

    @Autowired
    private ResponsibleService responsibleService;

    @Autowired
    private StudentRepository studentReposity;

    @Autowired
    private MatriculaService matriculaService;

    @Transactional
    public StudentRegistrationResponse createStudent(ResponsibleRequest responsibleDto, StudentRequest studentDto) {

        User responsibleUser = userService.createUser(
                responsibleDto.name(), responsibleDto.email(), responsibleDto.cpf(),
                responsibleDto.phone(), responsibleDto.address(), "ROLE_RESPONSAVEL");

        Responsible responsible = responsibleService.createReponsible(
                responsibleUser, responsibleDto.name(), responsibleDto.email(),
                responsibleDto.cpf(), responsibleDto.phone());

        User studentUser = userService.createUser(
                studentDto.fullName(), studentDto.educationalEmail(), studentDto.cpf(),
                responsibleDto.phone(), responsibleDto.address(), "ROLE_ALUNO");

        Student student = new Student(
                studentDto.matricula(), studentUser, studentDto.educationalEmail(), studentDto.birthDate());
        student.setResponsible(responsible);
        student = studentReposity.save(student);

        Matricula matricula = matriculaService.create(student);

        return new StudentRegistrationResponse(studentUser.getId(), matricula.getStatus());
    }
}
