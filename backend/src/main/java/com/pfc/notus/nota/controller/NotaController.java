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

    @GetMapping("/{id}")
    public ResponseEntity<NotaDTO> getById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(notaService.getById(id, authentication.getName()));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<NotaDTO>> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        return ResponseEntity.ok(notaService.getByStudent(studentId, authentication.getName()));
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<NotaDTO> create(@RequestBody @Valid NotaRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(notaService.save(dto, authentication.getName()));
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<NotaDTO> update(@PathVariable Long id, @RequestBody @Valid NotaRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(notaService.update(id, dto, authentication.getName()));
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        notaService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
