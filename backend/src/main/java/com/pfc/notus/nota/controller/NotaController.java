package com.pfc.notus.nota.controller;

import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.dto.NotaRequestDTO;
import com.pfc.notus.nota.service.NotaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/nota")
public class NotaController {

    @Autowired
    private NotaService notaService;

    // REFN: GET buscar nota por ID
    @GetMapping("/{id}")
    public ResponseEntity<NotaDTO> getById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(notaService.getById(id, authentication.getName()));
    }

    // REFN: GET buscar notas por aluno
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<NotaDTO>> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        return ResponseEntity.ok(notaService.getByStudent(studentId, authentication.getName()));
    }

    // REFN: POST criar nota
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<NotaDTO> create(@RequestBody @Valid NotaRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(notaService.save(dto, authentication.getName()));
    }

    // REFN: PUT atualizar nota
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<NotaDTO> update(@PathVariable Long id, @RequestBody @Valid NotaRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(notaService.update(id, dto, authentication.getName()));
    }

    // REFN: DELETE deletar nota
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        notaService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    // REFN: GET média do aluno em disciplina/bimestre
    @GetMapping("/media/aluno")
    public ResponseEntity<Double> getMediaDoAluno(
            @RequestParam Long studentId,
            @RequestParam Long disciplinaId,
            @RequestParam String bimestre,
            Authentication authentication) {
        studentAccessGuardService.assertCanView(studentId, authentication.getName());
        Double media = notaService.getMediaDoAluno(studentId, disciplinaId, com.pfc.notus.boletim.domain.Bimestre.valueOf(bimestre));
        return ResponseEntity.ok(media);
    }

    // REFN: GET média da sala em disciplina/bimestre
    @GetMapping("/media/sala")
    public ResponseEntity<Double> getMediaDaSala(
            @RequestParam Long disciplinaId,
            @RequestParam String bimestre) {
        Double media = notaService.getMediaDaSala(disciplinaId, com.pfc.notus.boletim.domain.Bimestre.valueOf(bimestre));
        return ResponseEntity.ok(media);
    }
}
