package com.pfc.notus.user.controller;

import com.pfc.notus.user.dto.ResponsibleDTO;
import com.pfc.notus.user.dto.ResponsibleRequest;
import com.pfc.notus.user.service.ResponsibleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/responsibles")
public class ResponsibleController {

    @Autowired
    private ResponsibleService responsibleService;

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ResponsibleDTO> update(@PathVariable Long id, @RequestBody @Valid ResponsibleRequest dto) {
        return ResponseEntity.ok(responsibleService.updateResponsible(id, dto));
    }
}
