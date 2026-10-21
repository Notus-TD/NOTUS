package com.pfc.notus.entrega.controller;

import com.pfc.notus.entrega.dto.EntregaDTO;
import com.pfc.notus.entrega.service.EntregaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/entrega")
@PreAuthorize("hasRole('PROFESSOR')")
public class EntregaController {

    @Autowired
    private EntregaService entregaService;

    /** Entregas das turmas e disciplinas em que o professor logado leciona. */
    @GetMapping
    public List<EntregaDTO> getDoProfessor(Authentication authentication) {
        return entregaService.getDoProfessor(authentication.getName());
    }

    @GetMapping("/student/{studentId}")
    public List<EntregaDTO> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        return entregaService.getByStudent(studentId, authentication.getName());
    }

    @PostMapping
    public ResponseEntity<EntregaDTO> create(@RequestBody @Valid EntregaDTO dto, Authentication authentication) {
        EntregaDTO created = entregaService.save(dto, authentication.getName());
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        entregaService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
