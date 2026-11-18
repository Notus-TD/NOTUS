package com.pfc.notus.lecionamento.controller;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.lecionamento.dto.LecionamentoDTO;
import com.pfc.notus.lecionamento.dto.LecionamentoRequestDTO;
import com.pfc.notus.lecionamento.service.LecionamentoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ! REFL: Endpoints do vínculo professor x turma x disciplina (/lecionamento), só admin: listar, criar e remover
@RestController
@RequestMapping(value = "/lecionamento")
@RequiredArgsConstructor
public class LecionamentoController {

    // ! REFL: service que valida e salva o vínculo
    private final LecionamentoService lecionamentoService;

    // ! REFL: GET /lecionamento - lista todos os vínculos
    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping
    public List<LecionamentoDTO> getAll() {
        return lecionamentoService.getAll();
    }

    // ! REFL: POST /lecionamento - vincula um professor a uma disciplina em uma turma
    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping
    public ResponseEntity<LecionamentoDTO> create(@RequestBody @Valid LecionamentoRequestDTO dto) {
        LecionamentoDTO created = lecionamentoService.create(dto);
        return ResponseEntity.ok(created);
    }

    // ! REFL: DELETE /lecionamento/{id} - remove o vínculo
    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        lecionamentoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
