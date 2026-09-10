package com.pfc.notus.user.service;

import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.dto.security.StudentInsertDTO;
import com.pfc.notus.user.repository.StudentReposity;
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
    private StudentReposity studentReposity;

    @Transactional
    public Student createStudent(StudentInsertDTO dto) {
        User responsibleUser = userService.createUser(
                dto.responsibleName(), dto.responsibleEmail(), dto.responsiblePhoneNumber(), dto.address(), "ROLE_RESPONSAVEL");
        Responsible responsible = responsibleService.createReponsible(
                responsibleUser, dto.responsibleName(), dto.responsibleEmail(), dto.responsibleCpf(), dto.responsiblePhoneNumber());

        User studentUser = userService.createUser(
                dto.fullName(), dto.educationalEmail(), dto.responsiblePhoneNumber(), dto.address(), "ROLE_ALUNO");

        Student student = new Student();
        student.setUser(studentUser);
        student.setResponsible(responsible);

        return studentReposity.save(student);
    }
}
