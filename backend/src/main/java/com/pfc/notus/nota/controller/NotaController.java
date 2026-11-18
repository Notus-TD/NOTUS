package com.pfc.notus.nota.controller;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.dto.NotaRequestDTO;
import com.pfc.notus.nota.service.NotaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ! REFNO: Endpoints de notas de avaliação (/nota): consultar, lançar, editar e excluir
@RestController
@RequestMapping(value = "/nota")
@RequiredArgsConstructor
public class NotaController {

    // ! REFNO: service que valida permissão, faixa da nota e bimestre aberto
    private final NotaService notaService;

    // ! REFNO: GET /nota/{id} - uma nota; valida se quem pediu pode ver o aluno
    @GetMapping("/{id}")
    public ResponseEntity<NotaDTO> getById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(notaService.getById(id, authentication.getName()));
    }

    // ! REFNO: GET /nota/student/{id} - todas as notas do aluno no ano letivo
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<NotaDTO>> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        return ResponseEntity.ok(notaService.getByStudent(studentId, authentication.getName()));
    }

    // ! REFNO: POST /nota - professor ou admin lança uma nota de avaliação
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<NotaDTO> create(@RequestBody @Valid NotaRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(notaService.save(dto, authentication.getName()));
    }

    // ! REFNO: PUT /nota/{id} - edita descrição, valor e bimestre
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<NotaDTO> update(@PathVariable Long id, @RequestBody @Valid NotaRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(notaService.update(id, dto, authentication.getName()));
    }

    // ! REFNO: DELETE /nota/{id} - apaga a nota
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        notaService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
