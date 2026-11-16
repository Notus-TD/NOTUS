package com.pfc.notus.disciplina.controller;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.disciplina.dto.DisciplinaDTO;
import com.pfc.notus.disciplina.service.DisciplinaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/disciplina")
@RequiredArgsConstructor
public class DisciplinaController {
    
    private final DisciplinaService disciplinaService;

    @GetMapping
    public List<DisciplinaDTO> getAllDisciplina(){
        return disciplinaService.getAllDisciplina();
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping
    public ResponseEntity<DisciplinaDTO> create(@RequestBody @Valid DisciplinaDTO dto){
        DisciplinaDTO created = disciplinaService.save(dto);
        return ResponseEntity.ok(created);
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<DisciplinaDTO> update(@PathVariable Long id, @RequestBody @Valid DisciplinaDTO dto){
        DisciplinaDTO updated = disciplinaService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping ("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        disciplinaService.delete(id);
        return ResponseEntity.noContent().build();
    }


}
