package com.pfc.notus.entrega.controller;

import com.pfc.notus.entrega.dto.EntregaDTO;
import com.pfc.notus.entrega.dto.EntregaRequestDTO;
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

    @GetMapping
    public ResponseEntity<List<EntregaDTO>> getDoProfessor(Authentication authentication) {
        return ResponseEntity.ok(entregaService.getDoProfessor(authentication.getName()));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<EntregaDTO>> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        return ResponseEntity.ok(entregaService.getByStudent(studentId, authentication.getName()));
    }

    @GetMapping("/atividade/{atividadeId}")
    public ResponseEntity<List<EntregaDTO>> getByAtividade(@PathVariable Long atividadeId, Authentication authentication) {
        return ResponseEntity.ok(entregaService.getByAtividade(atividadeId, authentication.getName()));
    }

    @PutMapping
    public ResponseEntity<EntregaDTO> marcar(@RequestBody @Valid EntregaRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(entregaService.marcar(dto, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        entregaService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
