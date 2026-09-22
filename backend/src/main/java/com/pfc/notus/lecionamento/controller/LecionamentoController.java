package com.pfc.notus.lecionamento.controller;

import com.pfc.notus.lecionamento.dto.LecionamentoDTO;
import com.pfc.notus.lecionamento.dto.LecionamentoRequestDTO;
import com.pfc.notus.lecionamento.service.LecionamentoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/lecionamento")
public class LecionamentoController {

    @Autowired
    private LecionamentoService lecionamentoService;

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping
    public List<LecionamentoDTO> getAll() {
        return lecionamentoService.getAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping
    public ResponseEntity<LecionamentoDTO> create(@RequestBody @Valid LecionamentoRequestDTO dto) {
        LecionamentoDTO created = lecionamentoService.create(dto);
        return ResponseEntity.ok(created);
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        lecionamentoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
