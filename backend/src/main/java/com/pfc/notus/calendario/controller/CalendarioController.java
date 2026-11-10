package com.pfc.notus.calendario.controller;

import com.pfc.notus.boletim.domain.AnoLetivo;
import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.calendario.dto.CalendarioDTO;
import com.pfc.notus.calendario.dto.CalendarioRequest;
import com.pfc.notus.calendario.service.CalendarioService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/calendario")
public class CalendarioController {

    private final CalendarioService calendarioService;

    public CalendarioController(CalendarioService calendarioService) {
        this.calendarioService = calendarioService;
    }

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

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{ano}/{bimestre}/reabrir")
    public CalendarioDTO reabrir(@PathVariable String ano, @PathVariable Bimestre bimestre, Authentication authentication) {
        return calendarioService.reabrir(ano, bimestre, authentication.getName());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{ano}/{bimestre}/fechar")
    public CalendarioDTO fechar(@PathVariable String ano, @PathVariable Bimestre bimestre, Authentication authentication) {
        return calendarioService.fechar(ano, bimestre, authentication.getName());
    }
}
