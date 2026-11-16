package com.pfc.notus.turma.controller;


import com.pfc.notus.lecionamento.dto.TurmaComDisciplinasDTO;
import com.pfc.notus.lecionamento.service.LecionamentoService;
import com.pfc.notus.turma.dto.TurmaAlunoRequestDTO;
import com.pfc.notus.turma.dto.TurmaAlunoResponseDTO;
import com.pfc.notus.turma.dto.TurmaAlunosLoteRequestDTO;
import com.pfc.notus.turma.dto.TurmaDTO;
import com.pfc.notus.turma.dto.TurmaDetalheDTO;
import com.pfc.notus.turma.dto.TurmaRequestDTO;
import com.pfc.notus.turma.service.TurmaService;
import com.pfc.notus.user.service.StudentAccessGuardService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// ! REFT: Endpoints de turmas (/turma): CRUD pelo admin, detalhe para admin/professor e associar/remover alunos
@RestController
@RequestMapping(value = "/turma")
public class TurmaController {

    // ! REFT: services de turma, de vínculo (para 'minhas turmas') e guard de permissão
    private final TurmaService turmaService;
    private final LecionamentoService lecionamentoService;
    private final StudentAccessGuardService studentAccessGuardService;

    // ! REFT: injeção via construtor
    public TurmaController(TurmaService turmaService, LecionamentoService lecionamentoService,
                           StudentAccessGuardService studentAccessGuardService) {
        this.turmaService = turmaService;
        this.lecionamentoService = lecionamentoService;
        this.studentAccessGuardService = studentAccessGuardService;
    }

    // ! REFT: GET /turma - admin lista todas as turmas com total de alunos
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<TurmaDTO>> getAllTurmas() {
        List<TurmaDTO> turmas = turmaService.getAllTurma();
        return ResponseEntity.ok(turmas);
    }

    // ! REFT: GET /turma/me - professor vê as turmas dele com as disciplinas que leciona
    @PreAuthorize("hasRole('PROFESSOR')")
    @GetMapping("/me")
    public List<TurmaComDisciplinasDTO> getMinhasTurmas(Authentication authentication) {
        return lecionamentoService.getMinhasTurmas(authentication.getName());
    }

    // ! REFT: GET /turma/{id} - detalhe com alunos e professores; professor só vê turma onde leciona
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @GetMapping("/{turmaId}")
    public ResponseEntity<TurmaDetalheDTO> getById(@PathVariable Long turmaId, Authentication authentication) {
        studentAccessGuardService.assertCanViewTurma(turmaId, authentication.getName());
        TurmaDetalheDTO turma = turmaService.getById(turmaId);
        return ResponseEntity.ok(turma);
    }

    // ! REFT: POST /turma - admin cria turma (nome + ano letivo)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<TurmaDTO> create(@RequestBody @Valid TurmaRequestDTO dto) {
        TurmaDTO created = turmaService.create(dto);
        return ResponseEntity.ok(created);
    }

    // ! REFT: PUT /turma/{id} - admin edita nome e ano letivo
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{turmaId}")
    public ResponseEntity<TurmaDTO> update(@PathVariable Long turmaId, @RequestBody @Valid TurmaRequestDTO dto) {
        TurmaDTO updated = turmaService.update(turmaId, dto);
        return ResponseEntity.ok(updated);
    }

    // ! REFT: DELETE /turma/{id} - admin exclui (só sem alunos, professores e lançamentos)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{turmaId}")
    public ResponseEntity<Void> delete(@PathVariable Long turmaId) {
        turmaService.delete(turmaId);
        return ResponseEntity.noContent().build();
    }

    // ! REFT: POST /turma/{id}/alunos - coloca um aluno na turma
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{turmaId}/alunos")
    public ResponseEntity<TurmaAlunoResponseDTO> associarAluno(@PathVariable Long turmaId, @RequestBody @Valid TurmaAlunoRequestDTO dto) {
        TurmaAlunoResponseDTO associado = turmaService.associarAluno(turmaId, dto);
        return ResponseEntity.ok(associado);
    }

    // ! REFT: POST /turma/{id}/alunos/lote - coloca vários alunos de uma vez
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{turmaId}/alunos/lote")
    public ResponseEntity<List<TurmaAlunoResponseDTO>> associarAlunosLote(@PathVariable Long turmaId, @RequestBody @Valid TurmaAlunosLoteRequestDTO dto) {
        List<TurmaAlunoResponseDTO> associados = turmaService.associarAlunosLote(turmaId, dto);
        return ResponseEntity.ok(associados);
    }

    // ! REFT: DELETE /turma/{id}/alunos/{studentId} - tira o aluno da turma
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{turmaId}/alunos/{studentId}")
    public ResponseEntity<Void> removerAluno(@PathVariable Long turmaId, @PathVariable Long studentId) {
        turmaService.removerAluno(turmaId, studentId);
        return ResponseEntity.noContent().build();
    }

}
