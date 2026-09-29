package com.pfc.notus.falta.controller;

import com.pfc.notus.falta.dto.FaltaDTO;
import com.pfc.notus.falta.dto.FaltaRequestDTO;
import com.pfc.notus.falta.dto.FrequenciaDisciplinaDTO;
import com.pfc.notus.falta.service.FaltaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/falta")
public class FaltaController {

    @Autowired
    private FaltaService faltaService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<FaltaDTO> getAllFaltas() {
        return faltaService.getAllFaltas();
    }

    @GetMapping("/student/{studentId}")
    public List<FaltaDTO> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        faltaService.assertCanView(studentId, authentication.getName());
        return faltaService.getByStudent(studentId);
    }

    @GetMapping("/me")
    public List<FaltaDTO> minhasFaltas(Authentication authentication) {
        return faltaService.getFaltasParaUsuarioLogado(authentication.getName());
    }

    @GetMapping("/me/frequencia")
    public List<FrequenciaDisciplinaDTO> minhaFrequencia(Authentication authentication) {
        return faltaService.getFrequenciaParaUsuarioLogado(authentication.getName());
    }

    @PreAuthorize("hasAnyRole('PROFESSOR')")
    @PostMapping("/associar")
    public ResponseEntity<FaltaDTO> associar(@RequestBody @Valid FaltaRequestDTO dto, Authentication authentication) {
        FaltaDTO created = faltaService.associarFalta(dto, authentication.getName());
        return ResponseEntity.ok(created);
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        faltaService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
