package com.pfc.notus.disciplina.controller;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.dto.AulaRequestDTO;
import com.pfc.notus.disciplina.dto.DisciplinaDTO;
import com.pfc.notus.disciplina.service.DisciplinaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/disciplina")
public class DisciplinaController {
    
    @Autowired
    private DisciplinaService disciplinaService;
    
    @GetMapping
    public List<Disciplina> getAllDisciplina(){
        return disciplinaService.getAllDisciplina();
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping
    public ResponseEntity<DisciplinaDTO> create(@RequestBody @Valid DisciplinaDTO dto){
        DisciplinaDTO created = disciplinaService.save(dto);
        return ResponseEntity.ok(created);
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping ("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        disciplinaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','PROFESSOR')")
    @PostMapping("/{id}/aulas")
    public ResponseEntity<Void> registrarAula(@PathVariable Long id, @RequestBody @Valid AulaRequestDTO req) {
        disciplinaService.registrarAula(id, req.data());
        return ResponseEntity.noContent().build();
    }

}
