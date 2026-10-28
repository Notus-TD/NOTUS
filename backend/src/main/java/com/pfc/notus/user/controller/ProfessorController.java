package com.pfc.notus.user.controller;

import com.pfc.notus.user.dto.ProfessorDTO;
import com.pfc.notus.user.dto.ProfessorRequest;
import com.pfc.notus.user.service.ProfessorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/professores")
public class ProfessorController {

    private final ProfessorService professorService;

    public ProfessorController(ProfessorService professorService) {
        this.professorService = professorService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ProfessorDTO> create(@RequestBody @Valid ProfessorRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(professorService.createProfessor(dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<ProfessorDTO>> findAll() {
        return ResponseEntity.ok(professorService.listProfessors());
    }
}
