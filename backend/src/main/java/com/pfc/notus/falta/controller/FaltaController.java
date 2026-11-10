package com.pfc.notus.falta.controller;

import com.pfc.notus.falta.dto.ChamadaDTO;
import com.pfc.notus.falta.dto.ChamadaRequestDTO;
import com.pfc.notus.falta.dto.FaltaDTO;
import com.pfc.notus.falta.dto.FrequenciaDisciplinaDTO;
import com.pfc.notus.falta.service.FaltaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    @PreAuthorize("hasRole('PROFESSOR')")
    @GetMapping("/chamada")
    public ChamadaDTO getChamada(@RequestParam Long turmaId, @RequestParam Long disciplinaId,
                                 @RequestParam LocalDate data, Authentication authentication) {
        return faltaService.getChamada(turmaId, disciplinaId, data, authentication.getName());
    }

    @PreAuthorize("hasRole('PROFESSOR')")
    @PutMapping("/chamada")
    public ChamadaDTO salvarChamada(@RequestBody @Valid ChamadaRequestDTO dto, Authentication authentication) {
        return faltaService.salvarChamada(dto, authentication.getName());
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        faltaService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
