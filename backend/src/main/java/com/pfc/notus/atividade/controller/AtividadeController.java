package com.pfc.notus.atividade.controller;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.atividade.dto.AtividadeDTO;
import com.pfc.notus.atividade.service.AtividadeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ! REFA: Endpoints de atividades (/atividade): listar, publicar, editar e excluir
@RestController
@RequestMapping(value = "/atividade")
@RequiredArgsConstructor
public class AtividadeController {

    // ! REFA: service que faz todo o trabalho; o controller só repassa a chamada
    private final AtividadeService atividadeService;

    // ! REFA: GET /atividade - admin lista todas as atividades do sistema
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<AtividadeDTO> getAllAtividade() {
        return atividadeService.getAllAtividade();
    }

    // ! REFA: GET /atividade/turma/{id} - professor ou admin lista as atividades de uma turma
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @GetMapping("/turma/{turmaId}")
    public List<AtividadeDTO> getByTurma(@PathVariable Long turmaId, Authentication authentication) {
        return atividadeService.getByTurma(turmaId, authentication.getName());
    }

    // ! REFA: GET /atividade/me - aluno logado vê as atividades da própria turma, com flag de entregue
    @PreAuthorize("hasRole('ALUNO')")
    @GetMapping("/me")
    public List<AtividadeDTO> getMinhas(Authentication authentication) {
        return atividadeService.getMinhas(authentication.getName());
    }

    // ! REFA: GET /atividade/student/{id} - responsável ou admin vê as atividades de um aluno
    @PreAuthorize("hasAnyRole('RESPONSAVEL', 'ADMIN')")
    @GetMapping("/student/{studentId}")
    public List<AtividadeDTO> getDoAluno(@PathVariable Long studentId, Authentication authentication) {
        return atividadeService.getDoAluno(studentId, authentication.getName());
    }

    // ! REFA: POST /atividade - professor ou admin publica uma atividade nova
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<AtividadeDTO> create(@RequestBody @Valid AtividadeDTO dto, Authentication authentication) {
        AtividadeDTO created = atividadeService.publicar(dto, authentication.getName());
        return ResponseEntity.ok(created);
    }

    // ! REFA: PUT /atividade/{id} - edita título, conteúdo, bimestre, prazo e pontos
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<AtividadeDTO> atualizar(@PathVariable Long id, @Valid @RequestBody AtividadeDTO dto,
                                                  Authentication authentication) {
        return ResponseEntity.ok(atividadeService.atualizar(id, dto, authentication.getName()));
    }

    // ! REFA: DELETE /atividade/{id} - exclui a atividade (só se ninguém entregou ainda)
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        atividadeService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
