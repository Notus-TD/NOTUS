package com.pfc.notus.matricula.controller;

import com.pfc.notus.matricula.domain.Matricula;
import com.pfc.notus.matricula.dto.MatriculaDTO;
import com.pfc.notus.matricula.service.MatriculaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping (value = "/matricula")
public class MatriculaController {

    @Autowired
    private MatriculaService matriculaService;

    @GetMapping
    public List<Matricula> getAllMatricula(){return matriculaService.getAllMatricula();}

    @PostMapping
    public ResponseEntity<MatriculaDTO> create(@RequestBody @Valid MatriculaDTO dto, UriComponentsBuilder uriBuilder){
        MatriculaDTO created = matriculaService.save(dto);
        URI uri = uriBuilder.path("/matricula/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(uri).body(created);
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@PathVariable Long id){
        matriculaService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
