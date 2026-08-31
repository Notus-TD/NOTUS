package com.pfc.notus.turma.controller;


import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.service.TurmaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(value = "/turma")
public class TurmaController {

    @Autowired
    private TurmaService turmaService;

    @PreAuthorize("hasRole('ROLE_PROFESSOR')") // para bloquear pela role
    @GetMapping
    public List<Turma> getAllTurmas() {return turmaService.getAllTurma();}

}
