package com.pfc.notus.falta.service;

import com.pfc.notus.boletim.domain.AnoLetivo;
import com.pfc.notus.calendario.service.CalendarioService;
import com.pfc.notus.disciplina.domain.AulaRegistro;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.AulaRegistroRepository;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.falta.domain.FaltaDomain;
import com.pfc.notus.falta.dto.FaltaDTO;
import com.pfc.notus.falta.dto.ChamadaAlunoDTO;
import com.pfc.notus.falta.dto.ChamadaDTO;
import com.pfc.notus.falta.dto.ChamadaFaltaRequestDTO;
import com.pfc.notus.falta.dto.ChamadaRequestDTO;
import com.pfc.notus.falta.mapper.FaltaMapper;
import com.pfc.notus.falta.dto.FrequenciaDisciplinaDTO;
import com.pfc.notus.falta.repository.FaltaRepository;
import com.pfc.notus.lecionamento.domain.Lecionamento;
import com.pfc.notus.lecionamento.repository.LecionamentoRepository;
import com.pfc.notus.notificacao.event.FaltaRegistradaEvent;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.turma.domain.Turma;
import com.pfc.notus.turma.repository.TurmaRepository;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FaltaService {

    private static final int MAXIMO_AULAS_POR_DIA = 2;
    private static final String DATA_FUTURA = "Não é possível lançar chamada em data futura.";

    @Autowired
    private FaltaRepository faltaRepository;

    @Autowired
    private TurmaRepository turmaRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DisiciplinaRepository disciplinaRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AulaRegistroRepository aulaRegistroRepository;

    @Autowired
    private StudentAccessGuardService studentAccessGuardService;

    @Autowired
    private LecionamentoRepository lecionamentoRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private CalendarioService calendarioService;

    public List<FaltaDTO> getAllFaltas() {
        return faltaRepository.findAll().stream().map(FaltaMapper::toDto).toList();
    }

    public List<FaltaDTO> getByStudent(Long studentId) {
        Student aluno = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId));
        return faltaRepository.findByAlunoIdAndAnoLetivo(studentId, AnoLetivo.doAluno(aluno)).stream()
                .map(FaltaMapper::toDto).toList();
    }

    @Transactional
    public ChamadaDTO getChamada(Long turmaId, Long disciplinaId, LocalDate data, String requesterEmail) {
        if (data == null) {
            throw new RegraNegocioException("Informe a data da chamada.");
        }
        studentAccessGuardService.assertCanTeachTurma(turmaId, disciplinaId, requesterEmail);
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada com o id: " + turmaId));
        return montarChamada(turma, disciplinaId, data);
    }

    @Transactional
    public ChamadaDTO salvarChamada(ChamadaRequestDTO dto, String requesterEmail) {
        if (dto.data().isAfter(LocalDate.now())) {
            throw new RegraNegocioException(DATA_FUTURA);
        }
        if (dto.aulas() < 1 || dto.aulas() > MAXIMO_AULAS_POR_DIA) {
            throw new RegraNegocioException("A chamada deve ter 1 ou 2 aulas no dia.");
        }
        Set<Long> repetidos = new HashSet<>();
        for (ChamadaFaltaRequestDTO falta : dto.faltas()) {
            if (falta.faltas() < 0 || falta.faltas() > dto.aulas()) {
                throw new RegraNegocioException("O aluno pode ter no máximo %d falta(s) nesta chamada.".formatted(dto.aulas()));
            }
            if (!repetidos.add(falta.studentId())) {
                throw new RegraNegocioException("Aluno repetido na chamada: " + falta.studentId());
            }
        }
        studentAccessGuardService.assertCanTeachTurma(dto.turmaId(), dto.disciplinaId(), requesterEmail);
        Turma turma = turmaRepository.findById(dto.turmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada com o id: " + dto.turmaId()));
        calendarioService.exigirDataLetiva(AnoLetivo.daTurma(turma), dto.data());
        Disciplina disciplina = disciplinaRepository.findById(dto.disciplinaId())
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + dto.disciplinaId()));
        User registradoPor = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + requesterEmail));
        Map<Long, Student> alunos = alunosAtivos(turma.getId()).stream()
                .collect(Collectors.toMap(Student::getId, Function.identity()));
        for (ChamadaFaltaRequestDTO falta : dto.faltas()) {
            if (!alunos.containsKey(falta.studentId())) {
                throw new RegraNegocioException("O aluno não pertence a esta turma: " + falta.studentId());
            }
        }

        String anoLetivo = AnoLetivo.daTurma(turma);
        AulaRegistro aula = aulaRegistroRepository
                .findByTurmaIdAndDisciplinaIdAndDataAndAnoLetivo(turma.getId(), disciplina.getId(), dto.data(), anoLetivo)
                .orElseGet(() -> new AulaRegistro(dto.data(), disciplina, turma, dto.aulas()));
        aula.setQuantidadeAulas(dto.aulas());
        aulaRegistroRepository.save(aula);

        Map<Long, List<FaltaDomain>> existentes = faltaRepository
                .findByAlunoIdInAndDisciplinaIdAndData(List.copyOf(alunos.keySet()), disciplina.getId(), dto.data()).stream()
                .collect(Collectors.groupingBy(f -> f.getAluno().getId()));
        for (ChamadaFaltaRequestDTO falta : dto.faltas()) {
            aplicarFaltas(alunos.get(falta.studentId()), falta.faltas(), existentes.getOrDefault(falta.studentId(), List.of()),
                    disciplina, dto.data(), registradoPor);
        }
        return montarChamada(turma, disciplina.getId(), dto.data());
    }

    @Transactional
    public void delete(Long id, String requesterEmail) {
        FaltaDomain falta = faltaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Falta não encontrada com o id: " + id));
        studentAccessGuardService.assertCanTeach(falta.getAluno().getId(), falta.getDisciplina().getId(), requesterEmail);
        faltaRepository.deleteById(id);
        notificacaoService.cancelarPorReferencia(NotificacaoService.REF_FALTA, id, "Falta excluída antes do envio");
    }

    @Transactional
    public void assertCanView(Long studentId, String requesterEmail) {
        studentAccessGuardService.assertCanView(studentId, requesterEmail);
    }

    @Transactional
    public List<FaltaDTO> getFaltasParaUsuarioLogado(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + email));
        if (user.hasRole("ROLE_PROFESSOR")) {
            return getFaltasDoProfessor(user.getId());
        }

        List<Student> alunos = resolverAlunos(email);
        if (alunos.isEmpty()) return List.of();
        return alunos.stream()
                .flatMap(a -> faltaRepository.findByAlunoIdAndAnoLetivo(a.getId(), AnoLetivo.doAluno(a)).stream())
                .map(FaltaMapper::toDto)
                .toList();
    }

    @Transactional
    public List<FrequenciaDisciplinaDTO> getFrequenciaParaUsuarioLogado(String email) {
        List<Student> alunos = resolverAlunos(email);
        List<Disciplina> disciplinas = disciplinaRepository.findAll();
        List<FrequenciaDisciplinaDTO> resultado = new ArrayList<>();

        for (Student aluno : alunos) {
            if (aluno.getTurma() == null) continue;
            Long turmaId = aluno.getTurma().getId();
            String anoLetivo = AnoLetivo.doAluno(aluno);
            List<FaltaDomain> faltas = faltaRepository.findByAlunoIdAndAnoLetivo(aluno.getId(), anoLetivo);

            for (Disciplina disciplina : disciplinas) {
                List<AulaRegistro> aulas = aulaRegistroRepository.findByTurmaIdAndDisciplinaIdAndAnoLetivo(turmaId, disciplina.getId(), anoLetivo);
                long totalAulas = aulas.stream().mapToInt(AulaRegistro::getQuantidadeAulas).sum();
                if (totalAulas == 0) continue;
                Set<LocalDate> datasDasAulas = aulas.stream().map(AulaRegistro::getData).collect(Collectors.toSet());

                long totalFaltas = faltas.stream()
                        .filter(f -> f.getDisciplina().getId().equals(disciplina.getId()) && datasDasAulas.contains(f.getData()))
                        .mapToInt(FaltaDomain::getQuantidade)
                        .sum();
                double percentual = Math.max(0, totalAulas - totalFaltas) / (double) totalAulas * 100;

                resultado.add(new FrequenciaDisciplinaDTO(
                        aluno.getId(), aluno.getFullName(), disciplina.getId(), disciplina.getTitle(), totalAulas, totalFaltas, percentual));
            }
        }

        return resultado;
    }

    private List<FaltaDTO> getFaltasDoProfessor(Long professorId) {
        List<Lecionamento> lecionamentos = lecionamentoRepository.findByProfessorId(professorId);
        if (lecionamentos.isEmpty()) return List.of();

        Set<String> turmaDisciplina = lecionamentos.stream()
                .map(l -> l.getTurma().getId() + ":" + l.getDisciplina().getId())
                .collect(Collectors.toSet());
        List<Long> turmaIds = lecionamentos.stream().map(l -> l.getTurma().getId()).distinct().toList();
        List<Student> alunos = studentRepository.findByTurmaIdIn(turmaIds);
        if (alunos.isEmpty()) return List.of();

        return alunos.stream()
                .flatMap(a -> faltaRepository.findByAlunoIdAndAnoLetivo(a.getId(), AnoLetivo.doAluno(a)).stream())
                .filter(f -> f.getAluno().getTurma() != null
                        && turmaDisciplina.contains(f.getAluno().getTurma().getId() + ":" + f.getDisciplina().getId()))
                .map(FaltaMapper::toDto)
                .toList();
    }

    private List<Student> resolverAlunos(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + email));

        if (user instanceof Student student) return List.of(student);
        if (user instanceof Responsible responsavel) return responsavel.getStudents();
        return List.of();
    }

    private ChamadaDTO montarChamada(Turma turma, Long disciplinaId, LocalDate data) {
        String anoLetivo = AnoLetivo.daTurma(turma);
        List<Student> alunos = alunosAtivos(turma.getId());
        Integer aulas = aulaRegistroRepository
                .findByTurmaIdAndDisciplinaIdAndDataAndAnoLetivo(turma.getId(), disciplinaId, data, anoLetivo)
                .map(AulaRegistro::getQuantidadeAulas)
                .orElse(null);
        String bloqueio = data.isAfter(LocalDate.now())
                ? DATA_FUTURA
                : calendarioService.motivoBloqueioDaData(anoLetivo, data).orElse(null);
        if (alunos.isEmpty()) {
            return FaltaMapper.toChamadaDto(turma.getId(), disciplinaId, data, aulas, List.of(), bloqueio);
        }

        List<Long> ids = alunos.stream().map(Student::getId).toList();
        Map<Long, Integer> faltasNoDia = somarPorAluno(faltaRepository.findByAlunoIdInAndDisciplinaIdAndData(ids, disciplinaId, data));
        Map<Long, Integer> totalFaltas = somarPorAluno(faltaRepository.findByAlunoIdInAndDisciplinaIdAndAnoLetivo(ids, disciplinaId, anoLetivo));
        List<ChamadaAlunoDTO> linhas = alunos.stream()
                .map(a -> FaltaMapper.toChamadaAlunoDto(a, faltasNoDia.getOrDefault(a.getId(), 0), totalFaltas.getOrDefault(a.getId(), 0)))
                .toList();
        return FaltaMapper.toChamadaDto(turma.getId(), disciplinaId, data, aulas, linhas, bloqueio);
    }

    private void aplicarFaltas(Student aluno, int faltas, List<FaltaDomain> doDia, Disciplina disciplina,
                               LocalDate data, User registradoPor) {
        if (faltas == 0) {
            doDia.forEach(this::excluirFalta);
            return;
        }
        doDia.stream().skip(1).forEach(this::excluirFalta);
        LocalDateTime agora = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        if (doDia.isEmpty()) {
            FaltaDomain nova = faltaRepository.save(new FaltaDomain(faltas, data, agora, aluno, registradoPor, disciplina));
            int total = faltaRepository
                    .findByAlunoIdInAndDisciplinaIdAndAnoLetivo(List.of(aluno.getId()), disciplina.getId(), AnoLetivo.doAluno(aluno)).stream()
                    .mapToInt(FaltaDomain::getQuantidade)
                    .sum();
            eventPublisher.publishEvent(new FaltaRegistradaEvent(nova.getId(), total));
            return;
        }
        FaltaDomain atual = doDia.getFirst();
        atual.setQuantidade(faltas);
        atual.setRegistradoPor(registradoPor);
        atual.setRegistradoEm(agora);
        faltaRepository.save(atual);
    }

    private void excluirFalta(FaltaDomain falta) {
        faltaRepository.delete(falta);
        notificacaoService.cancelarPorReferencia(NotificacaoService.REF_FALTA, falta.getId(), "Falta removida na chamada");
    }

    private List<Student> alunosAtivos(Long turmaId) {
        return studentRepository.findByTurmaId(turmaId, Sort.by("fullName")).stream()
                .filter(a -> a.getStatusMatricula() == StatusMatricula.ATIVA)
                .toList();
    }

    private static Map<Long, Integer> somarPorAluno(List<FaltaDomain> faltas) {
        return faltas.stream()
                .collect(Collectors.groupingBy(f -> f.getAluno().getId(), Collectors.summingInt(FaltaDomain::getQuantidade)));
    }
}
