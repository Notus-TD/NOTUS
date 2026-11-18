package com.pfc.notus.user.controller;

import com.pfc.notus.user.dto.ProfessorDTO;
import com.pfc.notus.user.dto.ProfessorRequest;
import com.pfc.notus.user.service.ProfessorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// ! REFU: Endpoints de professores (/professores), só admin: cadastrar, listar e desligar
@RestController
@RequestMapping("/professores")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ProfessorController {

    // ! REFU: service de professor
    private final ProfessorService professorService;

    // ! REFU: POST /professores - cadastra e manda convite por e-mail
    @PostMapping
    public ResponseEntity<ProfessorDTO> create(@RequestBody @Valid ProfessorRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(professorService.createProfessor(dto));
    }

    // ! REFU: GET /professores - lista os professores não anonimizados
    @GetMapping
    public ResponseEntity<List<ProfessorDTO>> findAll() {
        return ResponseEntity.ok(professorService.listProfessors());
    }

    // ! REFU: PUT /professores/{id}/desligar - bloqueia o acesso e remove os vínculos com turmas
    @PutMapping("/{id}/desligar")
    public ResponseEntity<ProfessorDTO> desligar(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(professorService.desligar(id, authentication.getName()));
    }
}
