package com.pfc.notus.turma.controller;


import com.pfc.notus.lecionamento.dto.TurmaComDisciplinasDTO;
import com.pfc.notus.Service.LecionamentoService;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.service.TurmaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(value = "/turma")
public class TurmaController {

    @Autowired
    private TurmaService turmaService;

    @Autowired
    private LecionamentoService lecionamentoService;

    @PreAuthorize("hasRole('PROFESSOR')")
    @GetMapping
    public List<Turma> getAllTurmas() {return turmaService.getAllTurma();}

    @PreAuthorize("hasRole('PROFESSOR')")
    @GetMapping("/me")
    public List<TurmaComDisciplinasDTO> getMinhasTurmas(Authentication authentication) {
        return lecionamentoService.getMinhasTurmas(authentication.getName());
    }

}
