package com.pfc.notus.nota.controller;

import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.service.NotaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping (value = "/nota")
public class NotaController {

    @Autowired
    private NotaService notaService;

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @GetMapping
    public List<Nota> getAllNota(){return notaService.getAllNota();}

    @GetMapping("/boletim/{boletimId}")
    public List<Nota> getByBoletim(@PathVariable Long boletimId, Authentication authentication) {
        return notaService.getByBoletim(boletimId, authentication.getName());
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<NotaDTO> create(@RequestBody @Valid NotaDTO dto) {
        NotaDTO created = notaService.save(dto);
        return ResponseEntity.ok(created);
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<NotaDTO> update(@PathVariable Long id, @RequestBody @Valid NotaDTO dto) {
        NotaDTO updated = notaService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        notaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
