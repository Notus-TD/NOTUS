package com.pfc.notus.falta.controller;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.falta.dto.ChamadaDTO;
import com.pfc.notus.falta.dto.ChamadaRequestDTO;
import com.pfc.notus.falta.dto.FaltaDTO;
import com.pfc.notus.falta.dto.FrequenciaDisciplinaDTO;
import com.pfc.notus.falta.service.FaltaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

// ! REFF: Endpoints de faltas e chamada (/falta): consultar faltas/frequência, fazer chamada e excluir falta
@RestController
@RequestMapping(value = "/falta")
@RequiredArgsConstructor
public class FaltaController {

    // ! REFF: service com toda a lógica de chamada e frequência
    private final FaltaService faltaService;

    // ! REFF: GET /falta - admin lista todas as faltas do sistema
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<FaltaDTO> getAllFaltas() {
        return faltaService.getAllFaltas();
    }

    // ! REFF: GET /falta/student/{id} - faltas de um aluno no ano letivo; valida quem pode ver
    @GetMapping("/student/{studentId}")
    public List<FaltaDTO> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        faltaService.assertCanView(studentId, authentication.getName());
        return faltaService.getByStudent(studentId);
    }

    // ! REFF: GET /falta/me - faltas do usuário logado (aluno: as dele; responsável: dos filhos; professor: das turmas dele)
    @GetMapping("/me")
    public List<FaltaDTO> minhasFaltas(Authentication authentication) {
        return faltaService.getFaltasParaUsuarioLogado(authentication.getName());
    }

    // ! REFF: GET /falta/me/frequencia - % de presença por disciplina do aluno logado ou dos filhos
    @GetMapping("/me/frequencia")
    public List<FrequenciaDisciplinaDTO> minhaFrequencia(Authentication authentication) {
        return faltaService.getFrequenciaParaUsuarioLogado(authentication.getName());
    }

    // ! REFF: GET /falta/chamada?turmaId&disciplinaId&data - lista da chamada do dia com as faltas já lançadas
    @PreAuthorize("hasRole('PROFESSOR')")
    @GetMapping("/chamada")
    public ChamadaDTO getChamada(@RequestParam Long turmaId, @RequestParam Long disciplinaId,
                                 @RequestParam LocalDate data, Authentication authentication) {
        return faltaService.getChamada(turmaId, disciplinaId, data, authentication.getName());
    }

    // ! REFF: PUT /falta/chamada - professor salva a chamada do dia (quantas aulas e faltas de cada aluno)
    @PreAuthorize("hasRole('PROFESSOR')")
    @PutMapping("/chamada")
    public ChamadaDTO salvarChamada(@RequestBody @Valid ChamadaRequestDTO dto, Authentication authentication) {
        return faltaService.salvarChamada(dto, authentication.getName());
    }

    // ! REFF: DELETE /falta/{id} - apaga uma falta
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        faltaService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
