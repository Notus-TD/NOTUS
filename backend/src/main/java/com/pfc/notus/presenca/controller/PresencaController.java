package com.pfc.notus.presenca.controller;

import com.pfc.notus.presenca.domain.Presenca;
import com.pfc.notus.presenca.dto.PresencaDTO;
import com.pfc.notus.presenca.service.PresencaService;
import com.pfc.notus.user.service.StudentAccessGuardService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/presenca")
public class PresencaController {

    @Autowired
    private PresencaService presencaService;

    @Autowired
    private StudentAccessGuardService studentAccessGuardService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<Presenca> getAllPresenca() {
        return presencaService.getAllPresenca();
    }

    @GetMapping("/student/{studentId}")
    public List<Presenca> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        studentAccessGuardService.assertCanView(studentId, authentication.getName());
        return presencaService.getByStudent(studentId);
    }

    @PreAuthorize("hasRole('PROFESSOR')")
    @PostMapping
    public ResponseEntity<PresencaDTO> create(@RequestBody @Valid PresencaDTO dto, Authentication authentication) {
        PresencaDTO created = presencaService.save(dto, authentication.getName());
        return ResponseEntity.ok(created);
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        presencaService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
