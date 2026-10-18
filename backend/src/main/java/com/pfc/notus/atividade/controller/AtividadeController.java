package com.pfc.notus.atividade.controller;


import com.pfc.notus.atividade.dto.AtividadeDTO;
import com.pfc.notus.atividade.service.AtividadeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/atividade")
public class AtividadeController {

    @Autowired
    private AtividadeService atividadeService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<AtividadeDTO> getAllAtividade() {
        return atividadeService.getAllAtividade();
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @GetMapping("/turma/{turmaId}")
    public List<AtividadeDTO> getByTurma(@PathVariable Long turmaId, Authentication authentication) {
        return atividadeService.getByTurma(turmaId, authentication.getName());
    }

    @PreAuthorize("hasRole('ALUNO')")
    @GetMapping("/me")
    public List<AtividadeDTO> getMinhas(Authentication authentication) {
        return atividadeService.getMinhas(authentication.getName());
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<AtividadeDTO> create(@RequestBody @Valid AtividadeDTO dto, Authentication authentication) {
        AtividadeDTO created = atividadeService.publicar(dto, authentication.getName());
        return ResponseEntity.ok(created);
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        atividadeService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
