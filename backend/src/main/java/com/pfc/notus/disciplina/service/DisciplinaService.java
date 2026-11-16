package com.pfc.notus.disciplina.service;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.dto.DisciplinaDTO;
import com.pfc.notus.disciplina.repository.DisciplinaRepository;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import jakarta.transaction.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

// ! REFD: CRUD de disciplinas com regra de nome único e bloqueio de exclusão quando há dados ligados
@Service
@RequiredArgsConstructor
public class DisciplinaService {

    // ! REFD: repositório da disciplina e do vínculo com professor (para checar antes de excluir)
    private final DisciplinaRepository disciplinaRepository;

    private final LecionamentoRepository lecionamentoRepository;

    // ! REFD: lista todas as disciplinas
    public List<DisciplinaDTO> getAllDisciplina() {
        return disciplinaRepository.findAll().stream().map(this::toDTO).toList();
    }

    // ! REFD: cria a disciplina; recusa se já existe outra com o mesmo nome (ignora maiúsculas)
    @Transactional
    public DisciplinaDTO save(DisciplinaDTO dto) {
        if (disciplinaRepository.existsByTitleIgnoreCase(dto.title())) {
            throw new ConflictException("Já existe uma disciplina chamada " + dto.title() + ".");
        }
        Disciplina entity = new Disciplina();
        entity.setTitle(dto.title());
        entity.setDescription(dto.description());
        entity.setCreated(LocalDateTime.now());

        entity = disciplinaRepository.save(entity);
        return toDTO(entity);
    }

    // ! REFD: edita título/descrição; recusa se o novo nome já é de outra disciplina
    @Transactional
    public DisciplinaDTO update(Long id, DisciplinaDTO dto) {
        Disciplina entity = disciplinaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + id));
        if (disciplinaRepository.existsByTitleIgnoreCaseAndIdNot(dto.title(), id)) {
            throw new ConflictException("Já existe uma disciplina chamada " + dto.title() + ".");
        }
        entity.setTitle(dto.title());
        entity.setDescription(dto.description());
        entity = disciplinaRepository.save(entity);
        return toDTO(entity);
    }

    // ! REFD: exclui; dá conflito se tem professor vinculado ou se o banco acusa notas/faltas/aulas/atividades ligadas
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

    // ! REFD: converte a entidade para DTO
    private DisciplinaDTO toDTO(Disciplina entity) {
        return new DisciplinaDTO(entity.getId(), entity.getTitle(), entity.getDescription(), entity.getCreated());
    }
}
