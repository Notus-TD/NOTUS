package com.pfc.notus.calendario.controller;

import com.pfc.notus.boletim.domain.AnoLetivo;
import com.pfc.notus.calendario.dto.CalendarioDTO;
import com.pfc.notus.calendario.dto.CalendarioRequest;
import com.pfc.notus.calendario.service.CalendarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/calendario")
@RequiredArgsConstructor
public class CalendarioController {

    private final CalendarioService calendarioService;

    @GetMapping
    public CalendarioDTO atual() {
        return calendarioService.getCalendario(AnoLetivo.atual());
    }

    @GetMapping("/{ano}")
    public CalendarioDTO doAno(@PathVariable String ano) {
        return calendarioService.getCalendario(ano);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{ano}")
    public CalendarioDTO salvar(@PathVariable String ano, @Valid @RequestBody CalendarioRequest request,
                                Authentication authentication) {
        return calendarioService.salvar(ano, request, authentication.getName());
    }
}
