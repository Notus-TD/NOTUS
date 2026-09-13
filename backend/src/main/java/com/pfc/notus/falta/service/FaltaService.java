package com.pfc.notus.falta.service;

import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.AulaRegistroRepository;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.falta.domain.FaltaDomain;
import com.pfc.notus.falta.dto.FaltaDTO;
import com.pfc.notus.falta.dto.FaltaRequestDTO;
import com.pfc.notus.falta.dto.FrequenciaDisciplinaDTO;
import com.pfc.notus.falta.repository.FaltaRepository;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FaltaService {

    @Autowired
    private FaltaRepository faltaRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DisiciplinaRepository disciplinaRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AulaRegistroRepository aulaRegistroRepository;

    public List<FaltaDTO> getAllFaltas() {
        return faltaRepository.findAll().stream().map(this::toDTO).toList();
    }

    public List<FaltaDTO> getByStudent(Long studentId) {
        return faltaRepository.findByAlunoId(studentId).stream().map(this::toDTO).toList();
    }

    @Transactional
    public FaltaDTO associarFalta(FaltaRequestDTO dto, String registradoPorEmail) {
        Student aluno = studentRepository.findById(dto.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + dto.studentId()));
        Disciplina disciplina = disciplinaRepository.findById(dto.disciplinaId())
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + dto.disciplinaId()));
        User registradoPor = userRepository.findByEmail(registradoPorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + registradoPorEmail));

        FaltaDomain entity = new FaltaDomain(dto.quantidade(), dto.data(), LocalDateTime.now(), aluno, registradoPor, disciplina);

        entity = faltaRepository.save(entity);
        return toDTO(entity);
    }

    @Transactional
    public void delete(Long id) {
        if (!faltaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Falta não encontrada com o id: " + id);
        }
        faltaRepository.deleteById(id);
    }

    @Transactional
    public void assertCanView(Long studentId, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + requesterEmail));

        if (requester.hasRole("ROLE_PROFESSOR") || requester.hasRole("ROLE_ADMIN")) return;
        if (requester.getId().equals(studentId)) return;
        if (requester instanceof Responsible responsavel
                && responsavel.getStudents().stream().anyMatch(s -> s.getId().equals(studentId))) {
            return;
        }
        throw new AccessDeniedException("Sem permissão para ver as faltas deste aluno.");
    }

    @Transactional
    public List<FaltaDTO> getFaltasParaUsuarioLogado(String email) {
        List<Student> alunos = resolverAlunos(email);
        if (alunos.isEmpty()) return List.of();
        List<Long> ids = alunos.stream().map(User::getId).toList();
        return faltaRepository.findByAlunoIdIn(ids).stream().map(this::toDTO).toList();
    }

    @Transactional
    public List<FrequenciaDisciplinaDTO> getFrequenciaParaUsuarioLogado(String email) {
        List<Student> alunos = resolverAlunos(email);
        List<Disciplina> disciplinas = disciplinaRepository.findAll();
        List<FrequenciaDisciplinaDTO> resultado = new ArrayList<>();

        for (Student aluno : alunos) {
            Map<Long, Integer> faltasPorDisciplina = faltaRepository.findByAlunoId(aluno.getId()).stream()
                    .collect(Collectors.groupingBy(f -> f.getDisciplina().getId(), Collectors.summingInt(FaltaDomain::getQuantidade)));

            for (Disciplina disciplina : disciplinas) {
                long totalAulas = aulaRegistroRepository.countByDisciplinaId(disciplina.getId());
                if (totalAulas == 0) continue;

                long totalFaltas = faltasPorDisciplina.getOrDefault(disciplina.getId(), 0);
                double percentual = Math.max(0, totalAulas - totalFaltas) / (double) totalAulas * 100;

                resultado.add(new FrequenciaDisciplinaDTO(
                        aluno.getId(), aluno.getFullName(), disciplina.getId(), disciplina.getTitle(), totalAulas, totalFaltas, percentual));
            }
        }

        return resultado;
    }

    private List<Student> resolverAlunos(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + email));

        if (user instanceof Student student) return List.of(student);
        if (user instanceof Responsible responsavel) return responsavel.getStudents();
        return List.of();
    }

    private FaltaDTO toDTO(FaltaDomain entity) {
        return new FaltaDTO(
                entity.getId(),
                entity.getData(),
                entity.getQuantidade(),
                entity.getRegistradoEm(),
                entity.getAluno().getId(),
                entity.getDisciplina().getId(),
                entity.getRegistradoPor().getId()
        );
    }
}
