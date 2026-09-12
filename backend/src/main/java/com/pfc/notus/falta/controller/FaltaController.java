package com.pfc.notus.falta.controller;

import com.pfc.notus.falta.dto.FaltaDTO;
import com.pfc.notus.falta.service.FaltaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/falta")
public class FaltaController {

    @Autowired
    private FaltaService faltaService;

    @GetMapping
    public List<FaltaDTO> getAllFaltas() {
        return faltaService.getAllFaltas();
    }

    @PreAuthorize("hasAnyRole('ROLE_PROFESSOR')")
    @GetMapping("/student/{studentId}")
    public List<FaltaDTO> getByStudent(@PathVariable Long studentId) {
        return faltaService.getByStudent(studentId);
    }

    @PreAuthorize("hasAnyRole('ROLE_ADMIN')")
    @PostMapping("/associar")
    public ResponseEntity<FaltaDTO> associar(@RequestBody @Valid FaltaDTO dto) {
        FaltaDTO created = faltaService.associarFalta(dto);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        faltaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
