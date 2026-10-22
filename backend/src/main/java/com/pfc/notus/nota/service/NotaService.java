package com.pfc.notus.nota.service;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.dto.NotaRequestDTO;
import com.pfc.notus.nota.mapper.NotaMapper;
import com.pfc.notus.nota.repository.NotaRepository;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotaService {

    private static final float NOTA_MINIMA = 0f;
    private static final float NOTA_MAXIMA = 10f;

    @Autowired
    private NotaRepository notaRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DisiciplinaRepository disciplinaRepository;

    @Autowired
    private StudentAccessGuardService studentAccessGuardService;

    @Transactional(readOnly = true)
    public NotaDTO getById(Long id, String requesterEmail) {
        Nota entity = buscarNota(id);
        studentAccessGuardService.assertCanView(entity.getStudent().getId(), requesterEmail);
        return NotaMapper.toDto(entity);
    }

    @Transactional(readOnly = true)
    public List<NotaDTO> getByStudent(Long studentId, String requesterEmail) {
        studentAccessGuardService.assertCanView(studentId, requesterEmail);
        return notaRepository.findByStudentIdOrderByIdAsc(studentId).stream()
                .map(NotaMapper::toDto)
                .toList();
    }

    @Transactional
    public NotaDTO save(NotaRequestDTO dto, String requesterEmail) {
        validarAvaliacao(dto);
        Student student = buscarAluno(dto.studentId());
        studentAccessGuardService.assertCanTeach(student.getId(), dto.disciplinaId(), requesterEmail);
        Disciplina disciplina = buscarDisciplina(dto.disciplinaId());

        Nota entity = notaRepository.save(NotaMapper.toEntity(dto, student, disciplina));
        return NotaMapper.toDto(entity);
    }

    @Transactional
    public NotaDTO update(Long id, NotaRequestDTO dto, String requesterEmail) {
        validarAvaliacao(dto);
        Nota entity = buscarNota(id);
        studentAccessGuardService.assertCanTeach(entity.getStudent().getId(), entity.getDisciplina().getId(), requesterEmail);
        if (!entity.getStudent().getId().equals(dto.studentId()) || !entity.getDisciplina().getId().equals(dto.disciplinaId())) {
            throw new RegraNegocioException("Não é possível trocar o aluno ou a disciplina de uma nota.");
        }

        entity.setDescricao(dto.descricao().trim());
        entity.setRate(dto.rate());
        entity.setBimestre(dto.bimestre());
        return NotaMapper.toDto(notaRepository.save(entity));
    }

    @Transactional
    public void delete(Long id, String requesterEmail) {
        Nota entity = buscarNota(id);
        studentAccessGuardService.assertCanTeach(entity.getStudent().getId(), entity.getDisciplina().getId(), requesterEmail);
        notaRepository.delete(entity);
    }

    private void validarAvaliacao(NotaRequestDTO dto) {
        if (dto.descricao() == null || dto.descricao().isBlank()) {
            throw new RegraNegocioException("Informe a descrição da avaliação.");
        }
        if (dto.rate() == null || dto.rate().isNaN() || dto.rate() < NOTA_MINIMA || dto.rate() > NOTA_MAXIMA) {
            throw new RegraNegocioException("A nota deve estar entre 0 e 10.");
        }
        if (dto.bimestre() == null) {
            throw new RegraNegocioException("Informe o bimestre da avaliação.");
        }
    }

    private Nota buscarNota(Long id) {
        return notaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nota não encontrada com o id: " + id));
    }

    private Student buscarAluno(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + id));
    }

    private Disciplina buscarDisciplina(Long id) {
        return disciplinaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + id));
    }
}
