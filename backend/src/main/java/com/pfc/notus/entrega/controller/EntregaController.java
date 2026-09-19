package com.pfc.notus.entrega.controller;

import com.pfc.notus.entrega.domain.Entrega;
import com.pfc.notus.entrega.dto.EntregaDTO;
import com.pfc.notus.entrega.service.EntregaService;
import com.pfc.notus.user.service.StudentAccessGuardService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/entrega")
public class EntregaController {

    @Autowired
    private EntregaService entregaService;

    @Autowired
    private StudentAccessGuardService studentAccessGuardService;

    @GetMapping
    public List<Entrega> getAllEntrega() {
        return entregaService.getAllEntrega();
    }

    @GetMapping("/student/{studentId}")
    public List<Entrega> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        studentAccessGuardService.assertCanView(studentId, authentication.getName());
        return entregaService.getByStudent(studentId);
    }

    @PostMapping
    public ResponseEntity<EntregaDTO> create(@RequestBody @Valid EntregaDTO dto) {
        EntregaDTO created = entregaService.save(dto);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        entregaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
