package com.pfc.notus.presenca.controller;

import com.pfc.notus.presenca.domain.Presenca;
import com.pfc.notus.presenca.dto.PresencaDTO;
import com.pfc.notus.presenca.service.PresencaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/presenca")
public class PresencaController {

    @Autowired
    private PresencaService presencaService;

    @GetMapping
    public List<Presenca> getAllPresenca() {
        return presencaService.getAllPresenca();
    }

    @GetMapping("/student/{studentId}")
    public List<Presenca> getByStudent(@PathVariable Long studentId) {
        return presencaService.getByStudent(studentId);
    }

    @PostMapping
    public ResponseEntity<PresencaDTO> create(@RequestBody @Valid PresencaDTO dto) {
        PresencaDTO created = presencaService.save(dto);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        presencaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
