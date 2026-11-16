package com.pfc.notus.user.service;

import lombok.RequiredArgsConstructor;
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
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

// ! REFU: Regras de aluno: cadastro (com responsável), acesso ao portal, cancelar/reativar matrícula, edição e listagens
@Service
@RequiredArgsConstructor
public class StudentService {

    // ! REFU: log de auditoria
    private static final Logger log = LoggerFactory.getLogger(StudentService.class);

    // ! REFU: services de usuário, responsável, notificação e senha + repositório de aluno
    private final UserService userService;

    private final ResponsibleService responsibleService;

    private final StudentRepository studentRepository;

    private final NotificacaoService notificacaoService;

    private final SenhaService senhaService;

    // ! REFU: cadastra o aluno: matrícula única, acha ou cria o responsável, cria sem convite (o responsável libera o acesso depois)
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

    // ! REFU: cadastra vários irmãos com o mesmo responsável
    @Transactional
    public List<StudentRegistrationResponse> createStudents(ResponsibleRequest responsibleDto, List<StudentRequest> studentDtos) {
        validarSemRepetidos(studentDtos);
        return studentDtos.stream()
                .map(dto -> createStudent(responsibleDto, dto))
                .toList();
    }

    /** No cadastro de irmãos, a mesma matrícula ou o mesmo e-mail não podem aparecer duas vezes. */
    // ! REFU: no lote, matrícula e e-mail não podem se repetir
    private static void validarSemRepetidos(List<StudentRequest> alunos) {
        Set<Long> matriculas = new HashSet<>();
        Set<String> emails = new HashSet<>();
        for (StudentRequest dto : alunos) {
            if (!matriculas.add(dto.matricula())) {
                throw new ConflictException("Matrícula repetida no cadastro: " + dto.matricula());
            }
            if (dto.educationalEmail() != null && !dto.educationalEmail().isBlank()
                    && !emails.add(dto.educationalEmail().trim().toLowerCase())) {
                throw new ConflictException("E-mail repetido no cadastro: " + dto.educationalEmail());
            }
        }
    }

    // ! REFU: responsável libera o login do filho: matrícula ativa, e-mail diferente do dele; manda convite se é o primeiro acesso
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

    // ! REFU: responsável tira o login do filho
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

    // ! REFU: garante que quem pediu é o responsável do aluno e que ele não foi anonimizado
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

    // ! REFU: admin cancela com motivo: aluno sai da turma, perde o login e os avisos pendentes são cancelados
    @Transactional
    public StudentMinDTO cancelarMatricula(Long studentId, String motivo, String requesterEmail) {
        if (motivo == null || motivo.isBlank()) {
            throw new RegraNegocioException("Informe o motivo do cancelamento da matrícula.");
        }
        Student student = buscarAlunoNaoAnonimizado(studentId);
        if (student.getStatusMatricula() != StatusMatricula.ATIVA) {
            throw new ConflictException("Só matrícula ativa pode ser cancelada.");
        }

        student.cancelarMatricula(motivo.trim());
        studentRepository.save(student);
        notificacaoService.cancelarPendentesDoAluno(student.getId(), "Matrícula cancelada");
        log.info(AuditMarker.AUDIT, "Matrícula do aluno {} cancelada por {}. Motivo: {}", student.getId(), requesterEmail, motivo.trim());
        return StudentMinDTO.of(student);
    }

    // ! REFU: admin reativa (só se o responsável não foi anonimizado); aluno volta sem turma
    @Transactional
    public StudentMinDTO reativarMatricula(Long studentId, String requesterEmail) {
        Student student = buscarAlunoNaoAnonimizado(studentId);
        if (student.getStatusMatricula() != StatusMatricula.CANCELADA) {
            throw new ConflictException("Só matrícula cancelada pode ser reativada.");
        }
        if (student.getResponsible() != null && student.getResponsible().getAnonimizadoEm() != null) {
            throw new ConflictException("Não é possível reativar: o responsável deste aluno foi anonimizado.");
        }

        student.reativarMatricula();
        studentRepository.save(student);
        log.info(AuditMarker.AUDIT, "Matrícula do aluno {} reativada por {}", student.getId(), requesterEmail);
        return StudentMinDTO.of(student);
    }

    // ! REFU: ficha completa do aluno
    @Transactional(readOnly = true)
    public StudentDetalheDTO getDetalhe(Long studentId) {
        return StudentDetalheDTO.of(buscarAluno(studentId));
    }

    // ! REFU: edita nome, e-mail, matrícula (única) e nascimento
    @Transactional
    public StudentDetalheDTO updateStudent(Long studentId, StudentRequest dto) {
        Student student = buscarAluno(studentId);
        if (studentRepository.existsByMatriculaAndIdNot(dto.matricula(), studentId)) {
            throw new ConflictException("Matrícula já cadastrada: " + dto.matricula());
        }
        trocarEmail(student, dto.educationalEmail());
        student.setFullName(dto.fullName().trim());
        student.setMatricula(dto.matricula());
        student.setBirthDate(dto.birthDate());
        studentRepository.save(student);
        return StudentDetalheDTO.of(student);
    }

    /** E-mail vazio apaga o e-mail do aluno, mas não se ele tem acesso ao portal (o login é o e-mail). */
    // ! REFU: e-mail vazio apaga o e-mail, mas não se o aluno tem acesso ao portal (o login é o e-mail)
    private void trocarEmail(Student student, String novoEmail) {
        String email = novoEmail == null ? "" : novoEmail.trim();
        if (!email.isEmpty()) {
            userService.atualizarEmail(student, email);
            return;
        }
        if (student.getAcessoLiberadoEm() != null) {
            throw new RegraNegocioException("O aluno tem acesso ao portal e precisa de um e-mail.");
        }
        student.setEmail(null);
    }

    // ! REFU: busca aluno ou dá 404
    private Student buscarAluno(Long studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId));
    }

    // ! REFU: busca aluno e recusa se já foi anonimizado
    private Student buscarAlunoNaoAnonimizado(Long studentId) {
        Student student = buscarAluno(studentId);
        if (student.getAnonimizadoEm() != null) {
            throw new ConflictException("Usuário já foi anonimizado.");
        }
        return student;
    }

    // ! REFU: todos os alunos (admin)
    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudents() {
        return studentRepository.findAll().stream()
                .map(StudentMinDTO::of)
                .toList();
    }

    // ! REFU: alunos de várias turmas (as do professor)
    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudentsByTurmas(java.util.Collection<Long> turmaIds) {
        if (turmaIds.isEmpty()) return List.of();
        return studentRepository.findByTurmaIdIn(turmaIds).stream()
                .map(StudentMinDTO::of)
                .toList();
    }

    // ! REFU: filhos de um responsável
    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudentsByResponsible(Long responsibleId) {
        return studentRepository.findByResponsibleId(responsibleId).stream()
                .map(StudentMinDTO::of)
                .toList();
    }

    // ! REFU: alunos de uma turma, por nome ou matrícula
    @Transactional(readOnly = true)
    public List<StudentMinDTO> listStudentsByTurma(Long turmaId, String sort) {
        Sort ordenacao = "matricula".equalsIgnoreCase(sort) ? Sort.by("matricula") : Sort.by("fullName");
        return studentRepository.findByTurmaId(turmaId, ordenacao).stream()
                .map(StudentMinDTO::of)
                .toList();
    }
}
