package com.pfc.notus.boletim.controller;


import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.service.BoletimService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping(value = "/boletim")
public class BoletimController {

    @Autowired
    private BoletimService boletimService;

    @GetMapping
    public List<Boletim> getAllBoletim(){return boletimService.getAllBoletim();}

    @PostMapping
    public ResponseEntity<BoletimDTO> create(@RequestBody @Valid BoletimDTO dto, UriComponentsBuilder uriBuilder) {
        BoletimDTO created = boletimService.save(dto);
        URI uri = uriBuilder.path("/boletim/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(uri).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        boletimService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
