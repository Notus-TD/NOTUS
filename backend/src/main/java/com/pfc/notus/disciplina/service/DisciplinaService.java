package com.pfc.notus.disciplina.service;

import com.pfc.notus.boletim.domain.AnoLetivo;
import com.pfc.notus.disciplina.domain.AulaRegistro;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.dto.DisciplinaDTO;
import com.pfc.notus.disciplina.repository.AulaRegistroRepository;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.repository.TurmaRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class DisciplinaService {

    @Autowired
    private DisiciplinaRepository disciplinaRepository;

    @Autowired
    private AulaRegistroRepository aulaRegistroRepository;

    @Autowired
    private TurmaRepository turmaRepository;

    @Autowired
    private LecionamentoRepository lecionamentoRepository;

    public List<DisciplinaDTO> getAllDisciplina() {
        return disciplinaRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional
    public DisciplinaDTO save(DisciplinaDTO dto) {
        Disciplina entity = new Disciplina();
        entity.setTitle(dto.title());
        entity.setDescription(dto.description());
        entity.setCreated(dto.dueDate());

        entity = disciplinaRepository.save(entity);
        return toDTO(entity);
    }

    @Transactional
    public DisciplinaDTO update(Long id, DisciplinaDTO dto) {
        Disciplina entity = disciplinaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + id));
        entity.setTitle(dto.title());
        entity.setDescription(dto.description());
        entity = disciplinaRepository.save(entity);
        return toDTO(entity);
    }

    @Transactional
    public void delete(Long id) {
        if (!disciplinaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Disciplina não encontrada com o id: " + id);
        }
        if (lecionamentoRepository.existsByDisciplinaId(id)) {
            throw new ConflictException("A disciplina tem professores vinculados. Remova os vínculos antes de excluí-la.");
        }
        try {
            disciplinaRepository.deleteById(id);
            disciplinaRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("A disciplina tem notas, faltas, aulas ou atividades lançadas e não pode ser excluída.");
        }
    }

    @Transactional
    public void registrarAula(Long disciplinaId, Long turmaId, LocalDate data) {
        Disciplina disciplina = disciplinaRepository.findById(disciplinaId)
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + disciplinaId));
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada com o id: " + turmaId));
        if (!lecionamentoRepository.existsByTurmaIdAndDisciplinaId(turmaId, disciplinaId)) {
            throw new RegraNegocioException("Esta disciplina não é lecionada nesta turma.");
        }

        if (!aulaRegistroRepository.existsByTurmaIdAndDisciplinaIdAndDataAndAnoLetivo(
                turmaId, disciplinaId, data, AnoLetivo.daTurma(turma))) {
            aulaRegistroRepository.save(new AulaRegistro(data, disciplina, turma));
        }
    }

    private DisciplinaDTO toDTO(Disciplina entity) {
        return new DisciplinaDTO(entity.getId(), entity.getTitle(), entity.getDescription(), entity.getCreated());
    }
}
