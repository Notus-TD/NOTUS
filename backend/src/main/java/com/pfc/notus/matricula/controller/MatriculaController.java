package com.pfc.notus.matricula.controller;

import com.pfc.notus.matricula.domain.Matricula;
import com.pfc.notus.matricula.service.MatriculaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping (value = "/matricula")
public class MatriculaController {

    @Autowired
    private MatriculaService matriculaService;

    @PreAuthorize("hasAnyRole('ROLE_ADMIN')")
    @GetMapping
    public List<Matricula> getAllMatricula(){return matriculaService.getAllMatricula();}



    @PreAuthorize("hasAnyRole('ROLE_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        matriculaService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
