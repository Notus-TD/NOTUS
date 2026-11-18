package com.pfc.notus.user.controller;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.user.dto.ResponsibleDTO;
import com.pfc.notus.user.dto.ResponsibleRequest;
import com.pfc.notus.user.service.ResponsibleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

// ! REFU: Endpoint de responsáveis (/responsibles): admin edita nome, e-mail e telefone
@RestController
@RequestMapping(value = "/responsibles")
@RequiredArgsConstructor
public class ResponsibleController {

    // ! REFU: service de responsável
    private final ResponsibleService responsibleService;

    // ! REFU: PUT /responsibles/{id} - edita os dados do responsável
    @PreAuthorize("hasAnyRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ResponsibleDTO> update(@PathVariable Long id, @RequestBody @Valid ResponsibleRequest dto) {
        return ResponseEntity.ok(responsibleService.updateResponsible(id, dto));
    }
}
