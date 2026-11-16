package com.pfc.notus.boletim.controller;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.dto.BoletimDisciplinaDTO;
import com.pfc.notus.boletim.dto.NotaFinalRequestDTO;
import com.pfc.notus.boletim.service.BoletimService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ! REFB: Endpoints do boletim (/boletim): consultar boletim do aluno e lançar/remover nota final
@RestController
@RequestMapping(value = "/boletim")
@RequiredArgsConstructor
public class BoletimController {

    // ! REFB: service que monta o boletim e valida o lançamento
    private final BoletimService boletimService;

    // ! REFB: GET /boletim/student/{id} - boletim completo do aluno, uma linha por disciplina com os bimestres
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<BoletimDisciplinaDTO>> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        return ResponseEntity.ok(boletimService.getByStudent(studentId, authentication.getName()));
    }

    // ! REFB: PUT /boletim/nota-final - professor ou admin lança (ou substitui) a nota final de um bimestre
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PutMapping("/nota-final")
    public ResponseEntity<BoletimDTO> lancarNotaFinal(@RequestBody @Valid NotaFinalRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(boletimService.lancarNotaFinal(dto, authentication.getName()));
    }

    // ! REFB: DELETE /boletim/{id} - apaga uma nota final lançada
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerNotaFinal(@PathVariable Long id, Authentication authentication) {
        boletimService.removerNotaFinal(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
