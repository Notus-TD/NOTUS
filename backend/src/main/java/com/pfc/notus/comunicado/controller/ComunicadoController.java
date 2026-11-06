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

@RestController
@RequestMapping("/comunicado")
public class ComunicadoController {

    private final ComunicadoService comunicadoService;

    public ComunicadoController(ComunicadoService comunicadoService) {
        this.comunicadoService = comunicadoService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ComunicadoDTO> publicar(@Valid @RequestBody ComunicadoRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(comunicadoService.publicar(request, authentication.getName()));
    }

    /** Recado do professor para uma turma específica */
    @PreAuthorize("hasRole('PROFESSOR')")
    @PostMapping("/recado")
    public ResponseEntity<ComunicadoDTO> publicarRecado(@Valid @RequestBody RecadoProfessorRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(comunicadoService.publicarRecado(request, authentication.getName()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<ComunicadoDTO> listar() {
        return comunicadoService.listarTodos();
    }

    /** Comunicados visíveis para quem está logado (aluno, responsável, professor ou admin). */
    @GetMapping("/me")
    public List<ComunicadoDTO> meus(Authentication authentication) {
        return comunicadoService.listarParaUsuario((UserDetails) authentication.getPrincipal());
    }
}
