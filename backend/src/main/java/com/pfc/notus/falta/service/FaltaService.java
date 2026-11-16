package com.pfc.notus.falta.service;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.boletim.domain.AnoLetivo;
import com.pfc.notus.calendario.service.CalendarioService;
import com.pfc.notus.disciplina.domain.AulaRegistro;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.AulaRegistroRepository;
import com.pfc.notus.disciplina.repository.DisciplinaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.falta.domain.FaltaDomain;
import com.pfc.notus.falta.dto.FaltaDTO;
import com.pfc.notus.falta.dto.ChamadaAlunoDTO;
import com.pfc.notus.falta.dto.ChamadaDTO;
import com.pfc.notus.falta.dto.ChamadaFaltaRequestDTO;
import com.pfc.notus.falta.dto.ChamadaRequestDTO;
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
@RequiredArgsConstructor
public class FaltaService {

    private static final int MAXIMO_AULAS_POR_DIA = 2;
    private static final String DATA_FUTURA = "Não é possível lançar chamada em data futura.";

    private final FaltaRepository faltaRepository;

    private final TurmaRepository turmaRepository;

    private final StudentRepository studentRepository;

    private final DisciplinaRepository disciplinaRepository;

    private final UserRepository userRepository;

    private final AulaRegistroRepository aulaRegistroRepository;

    private final StudentAccessGuardService studentAccessGuardService;

    private final LecionamentoRepository lecionamentoRepository;

    private final NotificacaoService notificacaoService;

    private final ApplicationEventPublisher eventPublisher;

    private final CalendarioService calendarioService;

    public List<FaltaDTO> getAllFaltas() {
        return faltaRepository.findAll().stream().map(FaltaDTO::from).toList();
    }

    public List<FaltaDTO> getByStudent(Long studentId) {
        Student aluno = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId));
        return faltaRepository.findByAlunoIdAndAnoLetivo(studentId, AnoLetivo.doAluno(aluno)).stream()
                .map(FaltaDTO::from).toList();
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
        validarChamada(dto);
        studentAccessGuardService.assertCanTeachTurma(dto.turmaId(), dto.disciplinaId(), requesterEmail);
        Turma turma = turmaRepository.findById(dto.turmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada com o id: " + dto.turmaId()));
        calendarioService.exigirDataLetiva(AnoLetivo.daTurma(turma), dto.data());
        Disciplina disciplina = disciplinaRepository.findById(dto.disciplinaId())
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + dto.disciplinaId()));
        User registradoPor = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + requesterEmail));
        Map<Long, Student> alunos = alunosDaChamada(turma, dto.faltas());

        registrarAula(turma, disciplina, dto.data(), dto.aulas());
        registrarFaltas(dto, alunos, disciplina, registradoPor);
        return montarChamada(turma, disciplina.getId(), dto.data());
    }

    /** Data não pode ser futura, 1 ou 2 aulas, e cada aluno aparece uma vez com no máximo uma falta por aula. */
    private static void validarChamada(ChamadaRequestDTO dto) {
        if (dto.data().isAfter(LocalDate.now())) {
            throw new RegraNegocioException(DATA_FUTURA);
        }
        if (dto.aulas() < 1 || dto.aulas() > MAXIMO_AULAS_POR_DIA) {
            throw new RegraNegocioException("A chamada deve ter 1 ou 2 aulas no dia.");
        }
        Set<Long> jaInformados = new HashSet<>();
        for (ChamadaFaltaRequestDTO falta : dto.faltas()) {
            if (falta.faltas() < 0 || falta.faltas() > dto.aulas()) {
                throw new RegraNegocioException("O aluno pode ter no máximo %d falta(s) nesta chamada.".formatted(dto.aulas()));
            }
            if (!jaInformados.add(falta.studentId())) {
                throw new RegraNegocioException("Aluno repetido na chamada: " + falta.studentId());
            }
        }
    }

    /** Alunos ativos da turma, por id. Recusa a chamada se vier aluno de fora da turma. */
    private Map<Long, Student> alunosDaChamada(Turma turma, List<ChamadaFaltaRequestDTO> faltas) {
        Map<Long, Student> alunos = alunosAtivos(turma.getId()).stream()
                .collect(Collectors.toMap(Student::getId, Function.identity()));
        for (ChamadaFaltaRequestDTO falta : faltas) {
            if (!alunos.containsKey(falta.studentId())) {
                throw new RegraNegocioException("O aluno não pertence a esta turma: " + falta.studentId());
            }
        }
        return alunos;
    }

    /** Cria ou atualiza o registro de quantas aulas a disciplina teve no dia. */
    private void registrarAula(Turma turma, Disciplina disciplina, LocalDate data, int quantidade) {
        AulaRegistro aula = aulaRegistroRepository
                .findByTurmaIdAndDisciplinaIdAndDataAndAnoLetivo(turma.getId(), disciplina.getId(), data, AnoLetivo.daTurma(turma))
                .orElseGet(() -> new AulaRegistro(data, disciplina, turma, quantidade));
        aula.setQuantidadeAulas(quantidade);
        aulaRegistroRepository.save(aula);
    }

    private void registrarFaltas(ChamadaRequestDTO dto, Map<Long, Student> alunos, Disciplina disciplina, User registradoPor) {
        Map<Long, List<FaltaDomain>> faltasDoDia = faltaRepository
                .findByAlunoIdInAndDisciplinaIdAndData(List.copyOf(alunos.keySet()), disciplina.getId(), dto.data()).stream()
                .collect(Collectors.groupingBy(f -> f.getAluno().getId()));
        for (ChamadaFaltaRequestDTO falta : dto.faltas()) {
            aplicarFaltas(alunos.get(falta.studentId()), falta.faltas(), faltasDoDia.getOrDefault(falta.studentId(), List.of()),
                    disciplina, dto.data(), registradoPor);
        }
    }

    @Transactional
    public void delete(Long id, String requesterEmail) {
        FaltaDomain falta = faltaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Falta não encontrada com o id: " + id));
        studentAccessGuardService.assertCanTeach(falta.getAluno().getId(), falta.getDisciplina().getId(), requesterEmail);
        // Bimestre fechado: a frequência dele já é oficial e não muda mais.
        calendarioService.exigirDataLetiva(falta.getAnoLetivo(), falta.getData());
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

        return resolverAlunos(email).stream()
                .flatMap(a -> faltaRepository.findByAlunoIdAndAnoLetivo(a.getId(), AnoLetivo.doAluno(a)).stream())
                .map(FaltaDTO::from)
                .toList();
    }

    @Transactional
    public List<FrequenciaDisciplinaDTO> getFrequenciaParaUsuarioLogado(String email) {
        List<Student> alunos = resolverAlunos(email);
        List<Disciplina> disciplinas = disciplinaRepository.findAll();
        return alunos.stream()
                .filter(aluno -> aluno.getTurma() != null)
                .flatMap(aluno -> frequenciaDoAluno(aluno, disciplinas).stream())
                .toList();
    }

    /** Uma linha por disciplina que já teve aula na turma atual do aluno. */
    private List<FrequenciaDisciplinaDTO> frequenciaDoAluno(Student aluno, List<Disciplina> disciplinas) {
        String anoLetivo = AnoLetivo.doAluno(aluno);
        List<FaltaDomain> faltas = faltaRepository.findByAlunoIdAndAnoLetivo(aluno.getId(), anoLetivo);
        List<FrequenciaDisciplinaDTO> resultado = new ArrayList<>();
        for (Disciplina disciplina : disciplinas) {
            List<AulaRegistro> aulas = aulaRegistroRepository
                    .findByTurmaIdAndDisciplinaIdAndAnoLetivo(aluno.getTurma().getId(), disciplina.getId(), anoLetivo).stream()
                    .filter(a -> naTurmaAtual(aluno, a.getData()))
                    .toList();
            long totalAulas = aulas.stream().mapToInt(AulaRegistro::getQuantidadeAulas).sum();
            if (totalAulas > 0) {
                long totalFaltas = faltasNasAulas(faltas, disciplina, aulas);
                double percentual = Math.max(0, totalAulas - totalFaltas) / (double) totalAulas * 100;
                resultado.add(new FrequenciaDisciplinaDTO(aluno.getId(), aluno.getFullName(),
                        disciplina.getId(), disciplina.getTitle(), totalAulas, totalFaltas, percentual));
            }
        }
        return resultado;
    }

    /** Soma só as faltas da disciplina lançadas em dias que contam como aula. */
    private static long faltasNasAulas(List<FaltaDomain> faltas, Disciplina disciplina, List<AulaRegistro> aulas) {
        Set<LocalDate> diasDeAula = aulas.stream().map(AulaRegistro::getData).collect(Collectors.toSet());
        return faltas.stream()
                .filter(f -> f.getDisciplina().getId().equals(disciplina.getId()) && diasDeAula.contains(f.getData()))
                .mapToInt(FaltaDomain::getQuantidade)
                .sum();
    }

    /** Faltas só das turmas e disciplinas que o professor leciona. */
    private List<FaltaDTO> getFaltasDoProfessor(Long professorId) {
        List<Lecionamento> lecionamentos = lecionamentoRepository.findByProfessorId(professorId);
        if (lecionamentos.isEmpty()) return List.of();

        Set<String> turmasEDisciplinas = lecionamentos.stream()
                .map(l -> l.getTurma().getId() + ":" + l.getDisciplina().getId())
                .collect(Collectors.toSet());
        List<Long> turmaIds = lecionamentos.stream().map(l -> l.getTurma().getId()).distinct().toList();
        return studentRepository.findByTurmaIdIn(turmaIds).stream()
                .flatMap(a -> faltaRepository.findByAlunoIdAndAnoLetivo(a.getId(), AnoLetivo.doAluno(a)).stream())
                .filter(f -> f.getAluno().getTurma() != null
                        && turmasEDisciplinas.contains(f.getAluno().getTurma().getId() + ":" + f.getDisciplina().getId()))
                .map(FaltaDTO::from)
                .toList();
    }

    private List<Student> resolverAlunos(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + email));

        if (user instanceof Student student) return List.of(student);
        if (user instanceof Responsible responsavel) return responsavel.getStudents();
        return List.of();
    }

    /** Lista da chamada: cada aluno ativo com as faltas do dia e o total no ano, mais o motivo se o dia estiver bloqueado. */
    private ChamadaDTO montarChamada(Turma turma, Long disciplinaId, LocalDate data) {
        String anoLetivo = AnoLetivo.daTurma(turma);
        Integer aulas = aulaRegistroRepository
                .findByTurmaIdAndDisciplinaIdAndDataAndAnoLetivo(turma.getId(), disciplinaId, data, anoLetivo)
                .map(AulaRegistro::getQuantidadeAulas)
                .orElse(null);
        List<ChamadaAlunoDTO> linhas = linhasDaChamada(alunosAtivos(turma.getId()), disciplinaId, data, anoLetivo);
        return new ChamadaDTO(turma.getId(), disciplinaId, data, aulas, linhas, motivoBloqueio(anoLetivo, data));
    }

    private String motivoBloqueio(String anoLetivo, LocalDate data) {
        if (data.isAfter(LocalDate.now())) {
            return DATA_FUTURA;
        }
        return calendarioService.motivoBloqueioDaData(anoLetivo, data).orElse(null);
    }

    private List<ChamadaAlunoDTO> linhasDaChamada(List<Student> alunos, Long disciplinaId, LocalDate data, String anoLetivo) {
        if (alunos.isEmpty()) {
            return List.of();
        }
        List<Long> ids = alunos.stream().map(Student::getId).toList();
        Map<Long, Integer> faltasNoDia = somarPorAluno(faltaRepository.findByAlunoIdInAndDisciplinaIdAndData(ids, disciplinaId, data));
        Map<Long, Integer> faltasNoAno = somarPorAluno(faltaRepository.findByAlunoIdInAndDisciplinaIdAndAnoLetivo(ids, disciplinaId, anoLetivo)
                .stream().filter(f -> naTurmaAtual(f.getAluno(), f.getData())).toList());
        return alunos.stream()
                .map(a -> ChamadaAlunoDTO.of(a, faltasNoDia.getOrDefault(a.getId(), 0), faltasNoAno.getOrDefault(a.getId(), 0)))
                .toList();
    }

    /** Zero faltas apaga o lançamento do dia; senão cria um novo (e avisa o responsável) ou atualiza o existente. */
    private void aplicarFaltas(Student aluno, int faltas, List<FaltaDomain> doDia, Disciplina disciplina,
                               LocalDate data, User registradoPor) {
        if (faltas == 0) {
            doDia.forEach(this::excluirFalta);
            return;
        }
        doDia.stream().skip(1).forEach(this::excluirFalta);
        if (doDia.isEmpty()) {
            criarFalta(aluno, faltas, disciplina, data, registradoPor);
        } else {
            atualizarFalta(doDia.getFirst(), faltas, registradoPor);
        }
    }

    private void criarFalta(Student aluno, int faltas, Disciplina disciplina, LocalDate data, User registradoPor) {
        LocalDateTime agora = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        FaltaDomain nova = faltaRepository.save(new FaltaDomain(faltas, data, agora, aluno, registradoPor, disciplina));
        int totalNoAno = faltaRepository
                .findByAlunoIdInAndDisciplinaIdAndAnoLetivo(List.of(aluno.getId()), disciplina.getId(), AnoLetivo.doAluno(aluno)).stream()
                .filter(f -> naTurmaAtual(aluno, f.getData()))
                .mapToInt(FaltaDomain::getQuantidade)
                .sum();
        eventPublisher.publishEvent(new FaltaRegistradaEvent(nova.getId(), totalNoAno));
    }

    private void atualizarFalta(FaltaDomain falta, int faltas, User registradoPor) {
        falta.setQuantidade(faltas);
        falta.setRegistradoPor(registradoPor);
        falta.setRegistradoEm(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        faltaRepository.save(falta);
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

    /**
     * Aluno transferido começa a frequência do zero na turma nova: só contam as aulas e faltas a partir da data em
     * que ele entrou nela (turmaDesde). Sem essa data (cadastro antigo), conta tudo.
     */
    private static boolean naTurmaAtual(Student aluno, LocalDate data) {
        return aluno.getTurmaDesde() == null || !data.isBefore(aluno.getTurmaDesde());
    }

    private static Map<Long, Integer> somarPorAluno(List<FaltaDomain> faltas) {
        return faltas.stream()
                .collect(Collectors.groupingBy(f -> f.getAluno().getId(), Collectors.summingInt(FaltaDomain::getQuantidade)));
    }
}
