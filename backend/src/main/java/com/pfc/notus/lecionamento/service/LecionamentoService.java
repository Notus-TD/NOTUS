package com.pfc.notus.lecionamento.service;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class LecionamentoService {

    @Autowired
    private LecionamentoRepository lecionamentoRepository;

    @Autowired
    private TurmaRepository turmaRepository;

    @Autowired
    private DisiciplinaRepository disciplinaRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public LecionamentoDTO create(LecionamentoRequestDTO dto) {
        Turma turma = turmaRepository.findById(dto.turmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada com o id: " + dto.turmaId()));
        Disciplina disciplina = disciplinaRepository.findById(dto.disciplinaId())
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + dto.disciplinaId()));
        User professor = userRepository.findById(dto.professorId())
                .orElseThrow(() -> new ResourceNotFoundException("Professor não encontrado com o id: " + dto.professorId()));

        if (!professor.hasRole("ROLE_PROFESSOR")) {
            throw new ConflictException("Usuário informado não é um professor.");
        }
        if (lecionamentoRepository.existsByTurmaIdAndDisciplinaIdAndProfessorId(
                turma.getId(), disciplina.getId(), professor.getId())) {
            throw new ConflictException("Este professor já está associado a esta turma e disciplina.");
        }
        if (lecionamentoRepository.existsByProfessorIdAndDisciplinaIdNot(professor.getId(), disciplina.getId())) {
            throw new ConflictException("Este professor já leciona outra disciplina. Cada professor está associado a uma única disciplina.");
        }

        Lecionamento entity = lecionamentoRepository.save(new Lecionamento(turma, disciplina, professor));
        return toDTO(entity);
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
        return lecionamentoRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional
    public List<TurmaComDisciplinasDTO> getMinhasTurmas(String professorEmail) {
        User professor = userRepository.findByEmail(professorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + professorEmail));

        List<Lecionamento> vinculos = lecionamentoRepository.findByProfessorId(professor.getId());

        Map<Long, Turma> turmasPorId = new LinkedHashMap<>();
        Map<Long, List<Disciplina>> disciplinasPorTurma = new LinkedHashMap<>();

        vinculos.stream()
                .sorted(Comparator.comparing(l -> l.getTurma().getName()))
                .forEach(l -> {
                    Long turmaId = l.getTurma().getId();
                    turmasPorId.putIfAbsent(turmaId, l.getTurma());
                    disciplinasPorTurma.computeIfAbsent(turmaId, k -> new ArrayList<>()).add(l.getDisciplina());
                });

        return turmasPorId.values().stream()
                .map(turma -> new TurmaComDisciplinasDTO(
                        turma.getId(),
                        turma.getName(),
                        turma.getSchoolYear(),
                        disciplinasPorTurma.get(turma.getId()).stream()
                                .sorted(Comparator.comparing(Disciplina::getTitle))
                                .map(d -> new TurmaComDisciplinasDTO.DisciplinaResumoDTO(d.getId(), d.getTitle()))
                                .toList()
                ))
                .toList();
    }

    private LecionamentoDTO toDTO(Lecionamento entity) {
        return new LecionamentoDTO(
                entity.getId(),
                entity.getTurma().getId(),
                entity.getTurma().getName(),
                entity.getDisciplina().getId(),
                entity.getDisciplina().getTitle(),
                entity.getProfessor().getId(),
                entity.getProfessor().getEmail()
        );
    }
}
