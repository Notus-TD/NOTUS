package com.pfc.notus.privacidade.controller;

import com.pfc.notus.privacidade.dto.AnonimizarRequest;
import com.pfc.notus.privacidade.dto.ExportacaoDadosDTO;
import com.pfc.notus.privacidade.dto.RegistroAnonimizacaoDTO;
import com.pfc.notus.privacidade.dto.ResumoAnonimizacaoDTO;
import com.pfc.notus.privacidade.service.AnonimizacaoService;
import com.pfc.notus.privacidade.service.ExportacaoDadosService;
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

import java.util.List;

/**
 * Direitos do titular (LGPD, art. 18). O titular faz o pedido na secretaria e o admin atende pelo painel:
 * consulta o resumo, gera a cópia dos dados ou anonimiza. Tudo fica registrado na auditoria.
 */
@RestController
@RequestMapping("/privacidade")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class PrivacidadeController {

    private final ExportacaoDadosService exportacaoDadosService;
    private final AnonimizacaoService anonimizacaoService;

    @GetMapping("/usuarios/{userId}/dados")
    public ExportacaoDadosDTO dados(@PathVariable Long userId, Authentication authentication) {
        return exportacaoDadosService.exportar(userId, authentication.getName());
    }

    @GetMapping("/usuarios/{userId}/resumo")
    public ResumoAnonimizacaoDTO resumo(@PathVariable Long userId) {
        return anonimizacaoService.resumo(userId);
    }

    @PutMapping("/usuarios/{userId}/anonimizar")
    public RegistroAnonimizacaoDTO anonimizar(@PathVariable Long userId, @Valid @RequestBody AnonimizarRequest request,
                                              Authentication authentication) {
        return anonimizacaoService.anonimizar(userId, request, authentication.getName());
    }

    @GetMapping("/anonimizacoes")
    public List<RegistroAnonimizacaoDTO> historico() {
        return anonimizacaoService.historico();
    }
}
