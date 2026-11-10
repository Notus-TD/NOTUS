package com.pfc.notus.notificacao.controller;

import com.pfc.notus.notificacao.domain.StatusNotificacao;
import com.pfc.notus.notificacao.domain.TipoNotificacao;
import com.pfc.notus.notificacao.dto.AvisoDTO;
import com.pfc.notus.notificacao.dto.NotificacaoDTO;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.notificacao.service.NotificacaoWorker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping(value = "/notificacao")
public class NotificacaoController {

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private NotificacaoWorker worker;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<NotificacaoDTO> listar(
            @RequestParam(required = false) TipoNotificacao tipo,
            @RequestParam(required = false) StatusNotificacao status,
            @RequestParam(required = false) Long responsavelId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate) {
        return notificacaoService.listar(tipo, status, responsavelId, de, ate);
    }

    @PreAuthorize("hasRole('RESPONSAVEL')")
    @GetMapping("/me")
    public List<AvisoDTO> meusAvisos(org.springframework.security.core.Authentication authentication) {
        return notificacaoService.avisosDoResponsavel(authentication.getName());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/reenviar")
    public ResponseEntity<NotificacaoDTO> reenviar(@PathVariable Long id) {
        NotificacaoDTO dto = notificacaoService.reenviar(id);
        worker.processarAgora();
        return ResponseEntity.ok(dto);
    }
}
