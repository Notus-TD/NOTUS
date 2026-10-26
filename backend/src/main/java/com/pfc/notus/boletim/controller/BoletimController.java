package com.pfc.notus.boletim.controller;

import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.dto.BoletimDisciplinaDTO;
import com.pfc.notus.boletim.dto.NotaFinalRequestDTO;
import com.pfc.notus.boletim.service.BoletimService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/boletim")
public class BoletimController {

    @Autowired
    private BoletimService boletimService;

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<BoletimDisciplinaDTO>> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        return ResponseEntity.ok(boletimService.getByStudent(studentId, authentication.getName()));
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PutMapping("/nota-final")
    public ResponseEntity<BoletimDTO> lancarNotaFinal(@RequestBody @Valid NotaFinalRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(boletimService.lancarNotaFinal(dto, authentication.getName()));
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerNotaFinal(@PathVariable Long id, Authentication authentication) {
        boletimService.removerNotaFinal(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
