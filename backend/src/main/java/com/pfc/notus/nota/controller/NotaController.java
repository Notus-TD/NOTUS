package com.pfc.notus.nota.controller;

import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.service.NotaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping (value = "/nota")
public class NotaController {

    @Autowired
    private NotaService notaService;

    @GetMapping
    public List<Nota> getAllNota(){return notaService.getAllNota();}
}
