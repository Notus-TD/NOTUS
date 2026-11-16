package com.pfc.notus.lecionamento.service;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisciplinaRepository;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.lecionamento.domain.Lecionamento;
import com.pfc.notus.lecionamento.dto.LecionamentoDTO;
import com.pfc.notus.lecionamento.dto.LecionamentoRequestDTO;
import com.pfc.notus.lecionamento.dto.TurmaComDisciplinasDTO;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.repository.TurmaRepository;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LecionamentoService {

    static final int MAX_PROFESSORES_POR_DISCIPLINA = 2;

    private final LecionamentoRepository lecionamentoRepository;

    private final TurmaRepository turmaRepository;

    private final DisciplinaRepository disciplinaRepository;

    private final UserRepository userRepository;

    @Transactional
    public LecionamentoDTO create(LecionamentoRequestDTO dto) {
        Turma turma = turmaRepository.findById(dto.turmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada com o id: " + dto.turmaId()));
        Disciplina disciplina = disciplinaRepository.findById(dto.disciplinaId())
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + dto.disciplinaId()));
        User professor = userRepository.findById(dto.professorId())
                .orElseThrow(() -> new ResourceNotFoundException("Professor não encontrado com o id: " + dto.professorId()));

        exigirProfessorAtivo(professor);
        if (lecionamentoRepository.existsByProfessorIdAndTurmaIdAndDisciplinaId(professor.getId(), turma.getId(), disciplina.getId())) {
            throw new ConflictException("Este professor já leciona esta disciplina nesta turma.");
        }
        if (lecionamentoRepository.countByTurmaIdAndDisciplinaId(turma.getId(), disciplina.getId()) >= MAX_PROFESSORES_POR_DISCIPLINA) {
            throw new ConflictException("Esta disciplina já tem " + MAX_PROFESSORES_POR_DISCIPLINA + " professores nesta turma.");
        }

        Lecionamento entity = lecionamentoRepository.save(new Lecionamento(turma, disciplina, professor));
        return LecionamentoDTO.of(entity);
    }

    @Transactional
    public void delete(Long id) {
        if (!lecionamentoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vínculo não encontrado com o id: " + id);
        }
        lecionamentoRepository.deleteById(id);
    }

    @Transactional
    public List<LecionamentoDTO> getAll() {
        return lecionamentoRepository.findAll().stream().map(LecionamentoDTO::of).toList();
    }

    @Transactional
    public List<TurmaComDisciplinasDTO> getMinhasTurmas(String professorEmail) {
        User professor = userRepository.findByEmail(professorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + professorEmail));

        Map<Long, List<Lecionamento>> vinculosPorTurma = lecionamentoRepository.findByProfessorId(professor.getId()).stream()
                .sorted(Comparator.comparing(l -> l.getTurma().getName()))
                .collect(Collectors.groupingBy(l -> l.getTurma().getId(), LinkedHashMap::new, Collectors.toList()));
        return vinculosPorTurma.values().stream()
                .map(LecionamentoService::turmaComDisciplinas)
                .toList();
    }

    private static void exigirProfessorAtivo(User professor) {
        if (!professor.hasRole("ROLE_PROFESSOR")) {
            throw new ConflictException("Usuário informado não é um professor.");
        }
        if (!professor.isAtivo()) {
            throw new ConflictException("Este professor está desligado e não pode receber vínculos.");
        }
    }

    /** Uma turma com as disciplinas que o professor dá nela, em ordem alfabética. */
    private static TurmaComDisciplinasDTO turmaComDisciplinas(List<Lecionamento> vinculosDaTurma) {
        Turma turma = vinculosDaTurma.getFirst().getTurma();
        List<TurmaComDisciplinasDTO.DisciplinaResumoDTO> disciplinas = vinculosDaTurma.stream()
                .map(Lecionamento::getDisciplina)
                .sorted(Comparator.comparing(Disciplina::getTitle))
                .map(d -> new TurmaComDisciplinasDTO.DisciplinaResumoDTO(d.getId(), d.getTitle()))
                .toList();
        return new TurmaComDisciplinasDTO(turma.getId(), turma.getName(), turma.getSchoolYear(), disciplinas);
    }
}
