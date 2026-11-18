package com.pfc.notus.disciplina.controller;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.disciplina.dto.DisciplinaDTO;
import com.pfc.notus.disciplina.service.DisciplinaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ! REFD: Endpoints de disciplinas (/disciplina): listar (qualquer logado) e criar/editar/excluir (admin)
@RestController
@RequestMapping(value = "/disciplina")
@RequiredArgsConstructor
public class DisciplinaController {
    
    // ! REFD: service com as regras de nome único e exclusão
    private final DisciplinaService disciplinaService;

    // ! REFD: GET /disciplina - lista todas as disciplinas
    @GetMapping
    public List<DisciplinaDTO> getAllDisciplina(){
        return disciplinaService.getAllDisciplina();
    }

    // ! REFD: POST /disciplina - admin cria uma disciplina
    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping
    public ResponseEntity<DisciplinaDTO> create(@RequestBody @Valid DisciplinaDTO dto){
        DisciplinaDTO created = disciplinaService.save(dto);
        return ResponseEntity.ok(created);
    }

    // ! REFD: PUT /disciplina/{id} - admin edita título e descrição
    @PreAuthorize("hasAnyRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<DisciplinaDTO> update(@PathVariable Long id, @RequestBody @Valid DisciplinaDTO dto){
        DisciplinaDTO updated = disciplinaService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    // ! REFD: DELETE /disciplina/{id} - admin exclui (só se não tiver vínculo nem lançamentos)
    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping ("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        disciplinaService.delete(id);
        return ResponseEntity.noContent().build();
    }


}
