package com.pfc.notus.entrega.controller;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.entrega.dto.EntregaDTO;
import com.pfc.notus.entrega.dto.EntregaRequestDTO;
import com.pfc.notus.entrega.service.EntregaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ! REFE: Endpoints de entregas de atividade (/entrega), só para professor: listar, marcar status/pontos e excluir
@RestController
@RequestMapping(value = "/entrega")
@PreAuthorize("hasRole('PROFESSOR')")
@RequiredArgsConstructor
public class EntregaController {

    // ! REFE: service que valida se o professor leciona e se o bimestre está aberto
    private final EntregaService entregaService;

    // ! REFE: GET /entrega - todas as entregas das turmas/disciplinas que o professor leciona
    @GetMapping
    public ResponseEntity<List<EntregaDTO>> getDoProfessor(Authentication authentication) {
        return ResponseEntity.ok(entregaService.getDoProfessor(authentication.getName()));
    }

    // ! REFE: GET /entrega/student/{id} - entregas de um aluno nas disciplinas do professor
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<EntregaDTO>> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        return ResponseEntity.ok(entregaService.getByStudent(studentId, authentication.getName()));
    }

    // ! REFE: GET /entrega/atividade/{id} - entregas de uma atividade (lista da turma)
    @GetMapping("/atividade/{atividadeId}")
    public ResponseEntity<List<EntregaDTO>> getByAtividade(@PathVariable Long atividadeId, Authentication authentication) {
        return ResponseEntity.ok(entregaService.getByAtividade(atividadeId, authentication.getName()));
    }

    // ! REFE: PUT /entrega - marca entregue/atrasada/não entregue e os pontos obtidos; cria ou atualiza
    @PutMapping
    public ResponseEntity<EntregaDTO> marcar(@RequestBody @Valid EntregaRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(entregaService.marcar(dto, authentication.getName()));
    }

    // ! REFE: DELETE /entrega/{id} - apaga a marcação
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        entregaService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
