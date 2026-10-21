package com.pfc.notus.entrega.service;

import com.pfc.notus.atividade.domain.Atividade;
import com.pfc.notus.atividade.repository.AtividadeRepository;
import com.pfc.notus.entrega.domain.Entrega;
import com.pfc.notus.entrega.dto.EntregaDTO;
import com.pfc.notus.entrega.repository.EntregaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Entregas são lançadas pelo professor. Ele só enxerga e mexe nas entregas das atividades
 * cuja turma e disciplina leciona, e o aluno precisa ser da turma da atividade.
 */
@Service
public class EntregaService {

    @Autowired
    private EntregaRepository entregaRepository;

    @Autowired
    private AtividadeRepository atividadeRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentAccessGuardService studentAccessGuardService;

    @Transactional(readOnly = true)
    public List<EntregaDTO> getDoProfessor(String requesterEmail) {
        return entregaRepository.buscarDoProfessor(buscarUsuario(requesterEmail).getId(), null).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EntregaDTO> getByStudent(Long studentId, String requesterEmail) {
        studentAccessGuardService.assertCanView(studentId, requesterEmail);
        return entregaRepository.buscarDoProfessor(buscarUsuario(requesterEmail).getId(), studentId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public EntregaDTO save(EntregaDTO dto, String requesterEmail) {
        Atividade atividade = atividadeRepository.findById(dto.atividadeId())
                .orElseThrow(() -> new ResourceNotFoundException("Atividade não encontrada com o id: " + dto.atividadeId()));
        Student student = studentRepository.findById(dto.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + dto.studentId()));

        if (student.getTurma() == null || !student.getTurma().getId().equals(atividade.getTurma().getId())) {
            throw new RegraNegocioException("O aluno não pertence à turma desta atividade.");
        }
        // professor precisa lecionar a disciplina da atividade na turma do aluno (que é a turma da atividade)
        studentAccessGuardService.assertCanTeach(student.getId(), atividade.getDisciplina().getId(), requesterEmail);

        Entrega entity = new Entrega(dto.content(), dto.submittedAt(), dto.grade(), dto.status());
        entity.setAtividade(atividade);
        entity.setStudent(student);

        entity = entregaRepository.save(entity);
        return toDTO(entity);
    }

    @Transactional
    public void delete(Long id, String requesterEmail) {
        Entrega entrega = entregaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entrega não encontrada com o id: " + id));
        studentAccessGuardService.assertCanTeach(entrega.getStudent().getId(), entrega.getAtividade().getDisciplina().getId(), requesterEmail);
        entregaRepository.delete(entrega);
    }

    private User buscarUsuario(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + email));
    }

    private EntregaDTO toDTO(Entrega entity) {
        return new EntregaDTO(
                entity.getId(),
                entity.getContent(),
                entity.getSubmittedAt(),
                entity.getGrade(),
                entity.getStatus(),
                entity.getAtividade().getId(),
                entity.getStudent().getId()
        );
    }
}
