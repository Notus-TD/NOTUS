package com.pfc.notus.entrega.service;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.boletim.domain.AnoLetivo;
import com.pfc.notus.calendario.service.CalendarioService;
import com.pfc.notus.atividade.domain.Atividade;
import com.pfc.notus.atividade.repository.AtividadeRepository;
import com.pfc.notus.entrega.domain.Entrega;
import com.pfc.notus.entrega.domain.StatusEntrega;
import com.pfc.notus.entrega.dto.EntregaDTO;
import com.pfc.notus.entrega.dto.EntregaRequestDTO;
import com.pfc.notus.entrega.repository.EntregaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class EntregaService {

    private final EntregaRepository entregaRepository;

    private final AtividadeRepository atividadeRepository;

    private final StudentRepository studentRepository;

    private final UserRepository userRepository;

    private final StudentAccessGuardService studentAccessGuardService;

    private final CalendarioService calendarioService;

    @Transactional(readOnly = true)
    public List<EntregaDTO> getDoProfessor(String requesterEmail) {
        return entregaRepository.buscarDoProfessor(buscarUsuario(requesterEmail).getId(), null).stream()
                .map(EntregaDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EntregaDTO> getByStudent(Long studentId, String requesterEmail) {
        studentAccessGuardService.assertCanView(studentId, requesterEmail);
        return entregaRepository.buscarDoProfessor(buscarUsuario(requesterEmail).getId(), studentId).stream()
                .map(EntregaDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EntregaDTO> getByAtividade(Long atividadeId, String requesterEmail) {
        Atividade atividade = buscarAtividade(atividadeId);
        studentAccessGuardService.assertCanTeachTurma(atividade.getTurma().getId(), atividade.getDisciplina().getId(), requesterEmail);
        return entregaRepository.findByAtividadeId(atividadeId).stream()
                .map(EntregaDTO::from)
                .toList();
    }

    @Transactional
    public EntregaDTO marcar(EntregaRequestDTO dto, String requesterEmail) {
        if (dto.status() == null) {
            throw new RegraNegocioException("Informe o status da entrega.");
        }
        Atividade atividade = buscarAtividade(dto.atividadeId());
        Student student = studentRepository.findById(dto.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + dto.studentId()));
        if (student.getTurma() == null || !student.getTurma().getId().equals(atividade.getTurma().getId())) {
            throw new RegraNegocioException("O aluno não pertence à turma desta atividade.");
        }
        studentAccessGuardService.assertCanTeach(student.getId(), atividade.getDisciplina().getId(), requesterEmail);
        calendarioService.exigirBimestreAberto(AnoLetivo.daTurma(atividade.getTurma()), atividade.getBimestre());

        Entrega entity = entregaRepository.findByAtividadeIdAndStudentId(atividade.getId(), student.getId())
                .orElseGet(() -> new Entrega(atividade, student));
        entity.setStatus(dto.status());
        entity.setPontosObtidos(pontosObtidos(atividade, dto));
        return EntregaDTO.from(entregaRepository.save(entity));
    }

    /**
     * Não entregou: 0 (ou nada, se a atividade não vale pontos).
     * Entregou: os pontos informados, entre 0 e o valor da atividade.
     */
    private Float pontosObtidos(Atividade atividade, EntregaRequestDTO dto) {
        Float valor = atividade.getPontos();
        if (dto.status() == StatusEntrega.NAO_ENTREGUE) {
            return valor == null ? null : 0f;
        }
        Float obtidos = dto.pontosObtidos();
        if (obtidos == null) {
            return null;
        }
        if (valor == null) {
            throw new RegraNegocioException("Esta atividade não vale pontos.");
        }
        if (obtidos.isNaN() || obtidos < 0 || obtidos > valor) {
            throw new RegraNegocioException(String.format(Locale.of("pt", "BR"), "Os pontos obtidos devem estar entre 0 e %.1f.", valor));
        }
        return obtidos;
    }

    @Transactional
    public void delete(Long id, String requesterEmail) {
        Entrega entrega = entregaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entrega não encontrada com o id: " + id));
        studentAccessGuardService.assertCanTeach(entrega.getStudent().getId(), entrega.getAtividade().getDisciplina().getId(), requesterEmail);
        calendarioService.exigirBimestreAberto(AnoLetivo.daTurma(entrega.getAtividade().getTurma()), entrega.getAtividade().getBimestre());
        entregaRepository.delete(entrega);
    }

    private Atividade buscarAtividade(Long id) {
        return atividadeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Atividade não encontrada com o id: " + id));
    }

    private User buscarUsuario(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + email));
    }
}
