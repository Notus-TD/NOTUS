package com.pfc.notus.user.service;

import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.domain.enums.TipoTokenSenha;
import com.pfc.notus.user.dto.ResponsibleRequest;
import com.pfc.notus.user.dto.StudentDetalheDTO;
import com.pfc.notus.user.dto.StudentMinDTO;
import com.pfc.notus.user.dto.StudentRegistrationResponse;
import com.pfc.notus.user.dto.StudentRequest;
import com.pfc.notus.user.repository.StudentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class StudentService {

    private static final Logger log = LoggerFactory.getLogger(StudentService.class);

    @Autowired
    private UserService userService;

    @Autowired
    private ResponsibleService responsibleService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private SenhaService senhaService;

    @Transactional
    public StudentRegistrationResponse createStudent(ResponsibleRequest responsibleDto, StudentRequest studentDto) {
        if (studentRepository.findByMatricula(studentDto.matricula()).isPresent()) {
            throw new ConflictException("Matrícula já cadastrada: " + studentDto.matricula());
        }

        Responsible responsible = responsibleService.findOrCreateResponsible(responsibleDto);

        String email = studentDto.educationalEmail() == null || studentDto.educationalEmail().isBlank()
                ? null
                : studentDto.educationalEmail().trim();
        Student student = new Student(
                studentDto.fullName(), email, studentDto.matricula(),
                studentDto.birthDate(), responsible);

        student = (Student) userService.registrarSemConvite(student, "ROLE_ALUNO");

        return new StudentRegistrationResponse(student.getId(), student.getFullName());
    }

    @Transactional
    public List<StudentRegistrationResponse> createStudents(ResponsibleRequest responsibleDto, List<StudentRequest> studentDtos) {
        Set<Long> matriculas = new HashSet<>();
        Set<String> emails = new HashSet<>();
        for (StudentRequest dto : studentDtos) {
            if (!matriculas.add(dto.matricula())) {
                throw new ConflictException("Matrícula repetida no cadastro: " + dto.matricula());
            }
            if (dto.educationalEmail() != null && !dto.educationalEmail().isBlank()
                    && !emails.add(dto.educationalEmail().trim().toLowerCase())) {
                throw new ConflictException("E-mail repetido no cadastro: " + dto.educationalEmail());
            }
        }

        return studentDtos.stream()
                .map(dto -> createStudent(responsibleDto, dto))
                .toList();
    }

    @Transactional
    public StudentMinDTO liberarAcesso(Long studentId, String email, String requesterEmail) {
        Student student = alunoDoResponsavel(studentId, requesterEmail);
        if (student.getStatusMatricula() != StatusMatricula.ATIVA) {
            throw new ConflictException("Só aluno com matrícula ativa pode ter acesso ao portal.");
        }
        if (student.getAcessoLiberadoEm() != null) {
            throw new ConflictException("O acesso deste aluno já está liberado.");
        }
        if (email.trim().equalsIgnoreCase(requesterEmail)) {
            throw new RegraNegocioException("O e-mail do aluno deve ser diferente do e-mail do responsável.");
        }

        if (!email.trim().equalsIgnoreCase(student.getEmail())) {
            userService.atualizarEmail(student, email.trim());
        }
        student.setAcessoLiberadoEm(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        student = studentRepository.save(student);
        if (student.isFirstLogin()) {
            senhaService.gerarLink(student, TipoTokenSenha.CONVITE);
        }
        log.info(AuditMarker.AUDIT, "Acesso do aluno {} liberado pelo responsável {}", student.getId(), student.getResponsible().getId());
        return StudentMinDTO.of(student);
    }

    @Transactional
    public StudentMinDTO retirarAcesso(Long studentId, String requesterEmail) {
        Student student = alunoDoResponsavel(studentId, requesterEmail);
        if (student.getAcessoLiberadoEm() == null) {
            throw new ConflictException("O acesso deste aluno não está liberado.");
        }

        student.setAcessoLiberadoEm(null);
        student = studentRepository.save(student);
        log.info(AuditMarker.AUDIT, "Acesso do aluno {} retirado pelo responsável {}", student.getId(), student.getResponsible().getId());
        return StudentMinDTO.of(student);
    }

    private Student alunoDoResponsavel(Long studentId, String requesterEmail) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId));
        if (student.getResponsible() == null || !requesterEmail.equalsIgnoreCase(student.getResponsible().getEmail())) {
            throw new AccessDeniedException("Só o responsável do aluno pode liberar ou retirar o acesso.");
        }
        if (student.getAnonimizadoEm() != null) {
            throw new ConflictException("Usuário já foi anonimizado.");
        }
        return student;
    }

    @Transactional
    public StudentMinDTO cancelarMatricula(Long studentId, String motivo, String requesterEmail) {
        if (motivo == null || motivo.isBlank()) {
            throw new RegraNegocioException("Informe o motivo do cancelamento da matrícula.");
        }
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId));
        if (student.getAnonimizadoEm() != null) {
            throw new ConflictException("Usuário já foi anonimizado.");
        }
        if (student.getStatusMatricula() != StatusMatricula.ATIVA) {
            throw new ConflictException("Só matrícula ativa pode ser cancelada.");
        }

        student.setStatusMatricula(StatusMatricula.CANCELADA);
        student.setTurma(null);
        student.setTurmaDesde(null);
        student.setAtivo(false);
        student.setMotivoCancelamento(motivo.trim());
        student.setMatriculaCanceladaEm(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        studentRepository.save(student);
        notificacaoService.cancelarPendentesDoAluno(student.getId(), "Matrícula cancelada");
        log.info(AuditMarker.AUDIT, "Matrícula do aluno {} cancelada por {}. Motivo: {}", student.getId(), requesterEmail, motivo.trim());
        return StudentMinDTO.of(student);
    }

    @Transactional
    public StudentMinDTO reativarMatricula(Long studentId, String requesterEmail) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId));
        if (student.getAnonimizadoEm() != null) {
            throw new ConflictException("Usuário já foi anonimizado.");
        }
        if (student.getStatusMatricula() != StatusMatricula.CANCELADA) {
            throw new ConflictException("Só matrícula cancelada pode ser reativada.");
        }
        if (student.getResponsible() != null && student.getResponsible().getAnonimizadoEm() != null) {
            throw new ConflictException("Não é possível reativar: o responsável deste aluno foi anonimizado.");
        }

        student.setStatusMatricula(StatusMatricula.ATIVA);
        student.setAtivo(true);
        student.setMotivoCancelamento(null);
        student.setMatriculaCanceladaEm(null);
        studentRepository.save(student);
        log.info(AuditMarker.AUDIT, "Matrícula do aluno {} reativada por {}", student.getId(), requesterEmail);
        return StudentMinDTO.of(student);
    }

    @Transactional(readOnly = true)
    public StudentDetalheDTO getDetalhe(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId));
        return StudentDetalheDTO.of(student);
    }

    @Transactional
    public StudentDetalheDTO updateStudent(Long studentId, StudentRequest dto) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId));
        if (studentRepository.existsByMatriculaAndIdNot(dto.matricula(), studentId)) {
            throw new ConflictException("Matrícula já cadastrada: " + dto.matricula());
        }
        String email = dto.educationalEmail() == null ? "" : dto.educationalEmail().trim();
        if (email.isEmpty() && student.getAcessoLiberadoEm() != null) {
            throw new RegraNegocioException("O aluno tem acesso ao portal e precisa de um e-mail.");
        }
        if (email.isEmpty()) {
            student.setEmail(null);
        }
        if (!email.isEmpty()) {
            userService.atualizarEmail(student, email);
        }
        student.setFullName(dto.fullName().trim());
        student.setMatricula(dto.matricula());
        student.setBirthDate(dto.birthDate());
        studentRepository.save(student);
        return StudentDetalheDTO.of(student);
    }

    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudents() {
        return studentRepository.findAll().stream()
                .map(StudentMinDTO::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudentsByTurmas(java.util.Collection<Long> turmaIds) {
        if (turmaIds.isEmpty()) return List.of();
        return studentRepository.findByTurmaIdIn(turmaIds).stream()
                .map(StudentMinDTO::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudentsByResponsible(Long responsibleId) {
        return studentRepository.findByResponsibleId(responsibleId).stream()
                .map(StudentMinDTO::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudentsByTurma(Long turmaId, String sort) {
        Sort ordenacao = "matricula".equalsIgnoreCase(sort) ? Sort.by("matricula") : Sort.by("fullName");
        return studentRepository.findByTurmaId(turmaId, ordenacao).stream()
                .map(StudentMinDTO::of)
                .toList();
    }
}
