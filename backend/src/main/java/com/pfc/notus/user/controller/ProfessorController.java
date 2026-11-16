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

@RestController
@RequestMapping("/professores")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ProfessorController {

    private final ProfessorService professorService;

    @PostMapping
    public ResponseEntity<ProfessorDTO> create(@RequestBody @Valid ProfessorRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(professorService.createProfessor(dto));
    }

    @GetMapping
    public ResponseEntity<List<ProfessorDTO>> findAll() {
        return ResponseEntity.ok(professorService.listProfessors());
    }

    @PutMapping("/{id}/desligar")
    public ResponseEntity<ProfessorDTO> desligar(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(professorService.desligar(id, authentication.getName()));
    }
}
