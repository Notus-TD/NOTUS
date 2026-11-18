package com.pfc.notus.user.controller;

import com.pfc.notus.user.dto.AcessoAlunoRequest;
import com.pfc.notus.user.dto.CancelamentoMatriculaRequest;
import com.pfc.notus.user.dto.StudentBatchRegistrationRequest;
import com.pfc.notus.user.dto.StudentDetalheDTO;
import com.pfc.notus.user.dto.StudentMinDTO;
import com.pfc.notus.user.dto.StudentRegistrationRequest;
import com.pfc.notus.user.dto.StudentRegistrationResponse;
import com.pfc.notus.user.dto.StudentRequest;
import com.pfc.notus.user.service.StudentAccessGuardService;
import com.pfc.notus.user.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ! REFU: Endpoints de alunos (/students): cadastro pelo admin, acesso ao portal pelo responsável, matrícula e listagens
@RestController
@RequestMapping("/students")
public class StudentController {

    // ! REFU: service de aluno e guard que decide quem pode ver o quê
    private final StudentService studentService;
    private final StudentAccessGuardService studentAccessGuardService;

    // ! REFU: injeção via construtor
    public StudentController(StudentService studentService, StudentAccessGuardService studentAccessGuardService) {
        this.studentService = studentService;
        this.studentAccessGuardService = studentAccessGuardService;
    }

    // ! REFU: POST /students - admin cadastra um aluno junto com o responsável (reaproveita se já existir)
    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping
    public ResponseEntity<StudentRegistrationResponse> create(@RequestBody @Valid StudentRegistrationRequest dto) {
        StudentRegistrationResponse response = studentService.createStudent(dto.responsible(), dto.student());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ! REFU: POST /students/lote - cadastra vários irmãos de uma vez com o mesmo responsável
    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping("/lote")
    public ResponseEntity<List<StudentRegistrationResponse>> createBatch(@RequestBody @Valid StudentBatchRegistrationRequest dto) {
        List<StudentRegistrationResponse> response = studentService.createStudents(dto.responsible(), dto.students());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ! REFU: GET /students/{id} - ficha completa do aluno com dados do responsável
    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<StudentDetalheDTO> getDetalhe(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getDetalhe(id));
    }

    // ! REFU: PUT /students/{id} - admin edita nome, e-mail, matrícula e nascimento
    @PreAuthorize("hasAnyRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<StudentDetalheDTO> update(@PathVariable Long id, @RequestBody @Valid StudentRequest dto) {
        return ResponseEntity.ok(studentService.updateStudent(id, dto));
    }

    // ! REFU: PUT /students/{id}/acesso - responsável libera o login do filho informando o e-mail dele
    @PreAuthorize("hasRole('RESPONSAVEL')")
    @PutMapping("/{id}/acesso")
    public ResponseEntity<StudentMinDTO> liberarAcesso(@PathVariable Long id, @RequestBody @Valid AcessoAlunoRequest dto,
                                                       Authentication authentication) {
        return ResponseEntity.ok(studentService.liberarAcesso(id, dto.email(), authentication.getName()));
    }

    // ! REFU: DELETE /students/{id}/acesso - responsável tira o login do filho
    @PreAuthorize("hasRole('RESPONSAVEL')")
    @DeleteMapping("/{id}/acesso")
    public ResponseEntity<StudentMinDTO> retirarAcesso(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(studentService.retirarAcesso(id, authentication.getName()));
    }

    // ! REFU: PUT /students/{id}/matricula/cancelar - admin cancela a matrícula com motivo
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/matricula/cancelar")
    public ResponseEntity<StudentMinDTO> cancelarMatricula(@PathVariable Long id,
                                                           @RequestBody @Valid CancelamentoMatriculaRequest request,
                                                           Authentication authentication) {
        return ResponseEntity.ok(studentService.cancelarMatricula(id, request.motivo(), authentication.getName()));
    }

    // ! REFU: PUT /students/{id}/matricula/reativar - admin reativa uma matrícula cancelada
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/matricula/reativar")
    public ResponseEntity<StudentMinDTO> reativarMatricula(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(studentService.reativarMatricula(id, authentication.getName()));
    }

    // ! REFU: GET /students - admin vê todos; professor vê só os alunos das turmas dele
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @GetMapping
    public ResponseEntity<List<StudentMinDTO>> findAll(Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (admin) {
            return ResponseEntity.ok(studentService.listStudents());
        }
        return ResponseEntity.ok(studentService.listStudentsByTurmas(
                studentAccessGuardService.turmaIdsDoProfessor(authentication.getName())));
    }

    // ! REFU: GET /students/responsible/{id} - filhos de um responsável (ele mesmo ou admin)
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/responsible/{responsibleId}")
    public ResponseEntity<List<StudentMinDTO>> findByResponsible(@PathVariable Long responsibleId, Authentication authentication) {
        studentAccessGuardService.assertCanViewResponsible(responsibleId, authentication.getName());
        return ResponseEntity.ok(studentService.listStudentsByResponsible(responsibleId));
    }

    // ! REFU: GET /students/turma/{id}?sort=nome|matricula - alunos de uma turma
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @GetMapping("/turma/{turmaId}")
    public ResponseEntity<List<StudentMinDTO>> findByTurma(
            @PathVariable Long turmaId,
            @RequestParam(required = false, defaultValue = "nome") String sort,
            Authentication authentication) {
        studentAccessGuardService.assertCanViewTurma(turmaId, authentication.getName());
        return ResponseEntity.ok(studentService.listStudentsByTurma(turmaId, sort));
    }
}
