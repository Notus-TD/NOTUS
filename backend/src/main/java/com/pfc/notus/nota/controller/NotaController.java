package com.pfc.notus.nota.controller;

import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.service.NotaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping (value = "/nota")
public class NotaController {

    @Autowired
    private NotaService notaService;

    @GetMapping
    public List<Nota> getAllNota(){return notaService.getAllNota();}

    @PostMapping
    public ResponseEntity<NotaDTO> create(@RequestBody @Valid NotaDTO dto) {
        NotaDTO created = notaService.save(dto);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        notaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
