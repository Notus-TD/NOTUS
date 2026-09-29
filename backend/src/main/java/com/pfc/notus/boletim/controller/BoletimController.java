package com.pfc.notus.boletim.controller;


import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.service.BoletimService;
import com.pfc.notus.user.service.StudentAccessGuardService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/boletim")
public class BoletimController {

    @Autowired
    private BoletimService boletimService;

    @Autowired
    private StudentAccessGuardService studentAccessGuardService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<Boletim> getAllBoletim(){return boletimService.getAllBoletim();}

    @GetMapping("/student/{studentId}")
    public List<Boletim> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        studentAccessGuardService.assertCanView(studentId, authentication.getName());
        return boletimService.getByStudent(studentId);
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<BoletimDTO> create(@RequestBody @Valid BoletimDTO dto, Authentication authentication) {
        studentAccessGuardService.assertCanView(dto.studentId(), authentication.getName());
        BoletimDTO created = boletimService.save(dto);
        return ResponseEntity.ok(created);
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PatchMapping("/{id}/fechar")
    public ResponseEntity<BoletimDTO> fechar(@PathVariable Long id, Authentication authentication) {
        studentAccessGuardService.assertCanView(boletimService.getStudentId(id), authentication.getName());
        return ResponseEntity.ok(boletimService.fechar(id));
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PatchMapping("/{id}/reabrir")
    public ResponseEntity<BoletimDTO> reabrir(@PathVariable Long id, Authentication authentication) {
        studentAccessGuardService.assertCanView(boletimService.getStudentId(id), authentication.getName());
        return ResponseEntity.ok(boletimService.reabrir(id));
    }

    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication){
        studentAccessGuardService.assertCanView(boletimService.getStudentId(id), authentication.getName());
        boletimService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
