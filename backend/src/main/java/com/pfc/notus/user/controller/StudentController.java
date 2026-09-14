package com.pfc.notus.user.controller;

import com.pfc.notus.user.dto.StudentMinDTO;
import com.pfc.notus.user.dto.StudentRegistrationRequest;
import com.pfc.notus.user.dto.StudentRegistrationResponse;
import com.pfc.notus.user.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping
    public ResponseEntity<StudentRegistrationResponse> create(@RequestBody @Valid StudentRegistrationRequest dto) {
        StudentRegistrationResponse response = studentService.createStudent(dto.responsible(), dto.student());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_PROFESSOR')")
    @GetMapping
    public ResponseEntity<List<StudentMinDTO>> findAll() {
        return ResponseEntity.ok(studentService.listStudents());
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/responsible/{responsibleId}")
    public ResponseEntity<List<StudentMinDTO>> findByResponsible(@PathVariable Long responsibleId) {
        return ResponseEntity.ok(studentService.listStudentsByResponsible(responsibleId));
    }
}
