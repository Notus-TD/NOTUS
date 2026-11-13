package com.pfc.notus.comunicado.controller;

import com.pfc.notus.comunicado.dto.ComunicadoDTO;
import com.pfc.notus.comunicado.dto.ComunicadoRequest;
import com.pfc.notus.comunicado.dto.RecadoProfessorRequest;
import com.pfc.notus.comunicado.service.ComunicadoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ! REFC: Quatro rotas: publicar comunicado (admin), publicar recado (professor), listar tudo (admin), listar para usuário
@RestController
@RequestMapping("/comunicado")
public class ComunicadoController {

    private final ComunicadoService comunicadoService;

    public ComunicadoController(ComunicadoService comunicadoService) {
        this.comunicadoService = comunicadoService;
    }

    // ! REFC: POST /comunicado - admin publica comunicado global (público escolhido); @PreAuthorize restringe a ADMIN
    @PreAuthorize("hasRole('ADMIN')") //so adm acessa 
    @PostMapping // rota post comunicado
    public ResponseEntity<ComunicadoDTO> publicar( // vai retornar como DTO
        @Valid // valida os dados 
        @RequestBody //recebe json do cliente
        ComunicadoRequest request, //  json -> java 
        Authentication authentication) { //dados user logado
        return ResponseEntity.status(HttpStatus.CREATED) //vai retornar um 201 
        .body(comunicadoService.publicar(request, authentication.getName())); //chama service 
    }

    // ! REFC: POST /comunicado/recado - professor publica recado para turma específica; público fixo=RESPONSAVEIS
    @PreAuthorize("hasRole('PROFESSOR')")
    @PostMapping("/recado")
    public ResponseEntity<ComunicadoDTO> publicarRecado(@Valid @RequestBody RecadoProfessorRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(comunicadoService.publicarRecado(request, authentication.getName()));
    }

    // ! REFC: GET /comunicado - admin vê todos os comunicados (sem filtro de público)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<ComunicadoDTO> listar() {
        return comunicadoService.listarTodos();
    }

    // ! REFC: GET /comunicado/me - usuário vê comunicados conforme seu papel (TODOS + seu público específico)
    @GetMapping("/me")
    public List<ComunicadoDTO> meus(Authentication authentication) {
        return comunicadoService.listarParaUsuario((UserDetails) authentication.getPrincipal());
    }
}
