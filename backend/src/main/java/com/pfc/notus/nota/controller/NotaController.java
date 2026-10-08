package com.pfc.notus.nota.controller;

import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.service.NotaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<Nota> getAllNota(){return notaService.getAllNota();}

    @GetMapping("/{id}")
    public ResponseEntity<NotaDTO> getById(@PathVariable Long id, Authentication authentication) {
        NotaDTO nota = notaService.getById(id, authentication.getName());
        return ResponseEntity.ok(nota);
    }

    @GetMapping("/boletim/{boletimId}")
    public List<Nota> getByBoletim(@PathVariable Long boletimId, Authentication authentication) {
        return notaService.getByBoletim(boletimId, authentication.getName());
    }

    @GetMapping("/boletim/{boletimId}/periodo/{period}")
    public List<Nota> getByBoletimAndPeriod(@PathVariable Long boletimId, @PathVariable String period, Authentication authentication) {
        return notaService.getByBoletimAndPeriod(boletimId, period, authentication.getName());
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @GetMapping("/disciplina/{disciplinaId}")
    public List<Nota> getByDisciplina(@PathVariable Long disciplinaId) {
        return notaService.getByDisciplina(disciplinaId);
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @GetMapping("/disciplina/{disciplinaId}/periodo/{period}")
    public List<Nota> getByDisciplinaAndPeriod(@PathVariable Long disciplinaId, @PathVariable String period) {
        return notaService.getByDisciplinaAndPeriod(disciplinaId, period);
    }

    @GetMapping("/boletim/{boletimId}/paginado")
    public ResponseEntity<Page<Nota>> getByBoletimPaged(@PathVariable Long boletimId, Pageable pageable, Authentication authentication) {
        return ResponseEntity.ok(notaService.getByBoletimPaged(boletimId, authentication.getName(), pageable));
    }

    @GetMapping("/boletim/{boletimId}/periodo/{period}/paginado")
    public ResponseEntity<Page<Nota>> getByBoletimAndPeriodPaged(@PathVariable Long boletimId, @PathVariable String period, Pageable pageable, Authentication authentication) {
        return ResponseEntity.ok(notaService.getByBoletimAndPeriodPaged(boletimId, period, authentication.getName(), pageable));
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @GetMapping("/disciplina/{disciplinaId}/paginado")
    public ResponseEntity<Page<Nota>> getByDisciplinaPaged(@PathVariable Long disciplinaId, Pageable pageable) {
        return ResponseEntity.ok(notaService.getByDisciplinaPaged(disciplinaId, pageable));
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @GetMapping("/disciplina/{disciplinaId}/periodo/{period}/paginado")
    public ResponseEntity<Page<Nota>> getByDisciplinaAndPeriodPaged(@PathVariable Long disciplinaId, @PathVariable String period, Pageable pageable) {
        return ResponseEntity.ok(notaService.getByDisciplinaAndPeriodPaged(disciplinaId, period, pageable));
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<NotaDTO> create(@RequestBody @Valid NotaDTO dto, Authentication authentication) {
        NotaDTO created = notaService.save(dto, authentication.getName());
        return ResponseEntity.ok(created);
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<NotaDTO> update(@PathVariable Long id, @RequestBody @Valid NotaDTO dto, Authentication authentication) {
        NotaDTO updated = notaService.update(id, dto, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication){
        notaService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
