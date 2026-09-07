package com.pfc.notus.atividade.controller;


import com.pfc.notus.atividade.domain.Atividade;
import com.pfc.notus.atividade.dto.AtividadeDTO;
import com.pfc.notus.atividade.service.AtividadeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/atividade")
public class AtividadeController {

    @Autowired
    private AtividadeService atividadeService;

    @GetMapping
    public List<Atividade> getAllAtividade() {
        return atividadeService.getAllAtividade();
    }

    @PostMapping
    public ResponseEntity<AtividadeDTO> create(@RequestBody @Valid AtividadeDTO dto) {
        AtividadeDTO created = atividadeService.save(dto);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        atividadeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
