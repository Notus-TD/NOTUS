package com.pfc.notus.disciplina.controller;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.dto.DisciplinaDTO;
import com.pfc.notus.disciplina.service.DisciplinaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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

    @PostMapping
    public ResponseEntity<DisciplinaDTO> create(@RequestBody @Valid DisciplinaDTO dto){
        DisciplinaDTO created = disciplinaService.save(dto);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@PathVariable Long id){
        disciplinaService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
}
