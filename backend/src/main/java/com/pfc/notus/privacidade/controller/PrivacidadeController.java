package com.pfc.notus.privacidade.controller;

import com.pfc.notus.privacidade.dto.AnonimizarRequest;
import com.pfc.notus.privacidade.dto.ExportacaoDadosDTO;
import com.pfc.notus.privacidade.dto.RegistroAnonimizacaoDTO;
import com.pfc.notus.privacidade.dto.ResumoAnonimizacaoDTO;
import com.pfc.notus.privacidade.service.AnonimizacaoService;
import com.pfc.notus.privacidade.dto.RespostaSolicitacaoRequest;
import com.pfc.notus.privacidade.dto.SolicitacaoDTO;
import com.pfc.notus.privacidade.dto.SolicitacaoRequest;
import com.pfc.notus.privacidade.service.ExportacaoDadosService;
import com.pfc.notus.privacidade.service.SolicitacaoTitularService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/privacidade")
public class PrivacidadeController {

    private final ExportacaoDadosService exportacaoDadosService;
    private final SolicitacaoTitularService solicitacaoTitularService;
    private final AnonimizacaoService anonimizacaoService;

    public PrivacidadeController(ExportacaoDadosService exportacaoDadosService,
                                 SolicitacaoTitularService solicitacaoTitularService,
                                 AnonimizacaoService anonimizacaoService) {
        this.exportacaoDadosService = exportacaoDadosService;
        this.solicitacaoTitularService = solicitacaoTitularService;
        this.anonimizacaoService = anonimizacaoService;
    }

    @PreAuthorize("hasRole('RESPONSAVEL')")
    @GetMapping("/meus-dados")
    public ExportacaoDadosDTO meusDados(Authentication authentication) {
        return exportacaoDadosService.exportarDoResponsavel(authentication.getName());
    }

    @PreAuthorize("hasRole('RESPONSAVEL')")
    @PostMapping("/solicitacoes")
    public ResponseEntity<SolicitacaoDTO> solicitar(@Valid @RequestBody SolicitacaoRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(solicitacaoTitularService.solicitar(request, authentication.getName()));
    }

    @PreAuthorize("hasRole('RESPONSAVEL')")
    @GetMapping("/solicitacoes/me")
    public List<SolicitacaoDTO> minhas(Authentication authentication) {
        return solicitacaoTitularService.listarDoResponsavel(authentication.getName());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/solicitacoes")
    public List<SolicitacaoDTO> listar() {
        return solicitacaoTitularService.listarTodas();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/solicitacoes/{id}/responder")
    public SolicitacaoDTO responder(@PathVariable Long id, @Valid @RequestBody RespostaSolicitacaoRequest request,
                                    Authentication authentication) {
        return solicitacaoTitularService.responder(id, request, authentication.getName());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/usuarios/{userId}/resumo")
    public ResumoAnonimizacaoDTO resumo(@PathVariable Long userId) {
        return anonimizacaoService.resumo(userId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/usuarios/{userId}/anonimizar")
    public RegistroAnonimizacaoDTO anonimizar(@PathVariable Long userId, @Valid @RequestBody AnonimizarRequest request,
                                              Authentication authentication) {
        return anonimizacaoService.anonimizar(userId, request, authentication.getName());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/anonimizacoes")
    public List<RegistroAnonimizacaoDTO> historico() {
        return anonimizacaoService.historico();
    }
}
