package com.pfc.notus.boletim.service;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.calendario.service.CalendarioService;
import com.pfc.notus.boletim.domain.AnoLetivo;
import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.dto.BoletimDisciplinaDTO;
import com.pfc.notus.boletim.dto.NotaFinalRequestDTO;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisciplinaRepository;
import com.pfc.notus.entrega.domain.Entrega;
import com.pfc.notus.entrega.repository.EntregaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.repository.NotaRepository;
import com.pfc.notus.notificacao.event.NotaFinalLancadaEvent;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.OptionalDouble;
import java.util.function.Function;
import java.util.stream.Collectors;

// ! REFB: Monta o boletim do aluno juntando notas de avaliações, pontos de atividades e notas finais; também lança/remove nota final
@Service
@RequiredArgsConstructor
public class BoletimService {

    // ! REFB: faixa permitida para nota final
    private static final float NOTA_MINIMA = 0f;
    private static final float NOTA_MAXIMA = 10f;

    // ! REFB: repositórios de nota, entrega, aluno, disciplina e services de permissão, notificação e calendário
    private final BoletimRepository boletimRepository;

    private final NotaRepository notaRepository;

    private final EntregaRepository entregaRepository;

    private final StudentRepository studentRepository;

    private final DisciplinaRepository disciplinaRepository;

    private final UserRepository userRepository;

    private final StudentAccessGuardService studentAccessGuardService;

    private final NotificacaoService notificacaoService;

    private final ApplicationEventPublisher eventPublisher;

    private final CalendarioService calendarioService;

    // ! REFB: ponto de entrada do boletim: valida se quem pediu pode ver o aluno e monta o boletim
    @Transactional(readOnly = true)
    public List<BoletimDisciplinaDTO> getByStudent(Long studentId, String requesterEmail) {
        studentAccessGuardService.assertCanView(studentId, requesterEmail);

        return montarBoletim(studentId);
    }

    // ! REFB: busca notas, notas finais e entregas pontuadas do ano letivo e agrupa tudo por disciplina+bimestre
    private List<BoletimDisciplinaDTO> montarBoletim(Long studentId) {
        String ano = anoLetivoDoAluno(studentId);
        List<Nota> notas = notaRepository.findByStudentIdAndAnoLetivoOrderByIdAsc(studentId, ano);
        List<Boletim> boletins = boletimRepository.findByStudentIdAndAnoLetivo(studentId, ano);
        List<Entrega> pontuadas = entregasPontuadas(studentId, ano);

        Map<Celula, Double> medias = notas.stream()
                .collect(Collectors.groupingBy(n -> new Celula(n.getDisciplina().getId(), n.getBimestre()),
                        Collectors.averagingDouble(Nota::getRate)));
        Map<Celula, Boletim> notasFinais = boletins.stream()
                .collect(Collectors.toMap(b -> new Celula(b.getDisciplina().getId(), b.getBimestre()), Function.identity()));
        Map<Celula, Double> pontos = pontuadas.stream()
                .collect(Collectors.groupingBy(BoletimService::celulaDaEntrega,
                        Collectors.summingDouble(Entrega::getPontosObtidos)));

        return disciplinasComLancamento(notas, boletins, pontuadas).stream()
                .sorted(Comparator.comparing(Disciplina::getTitle))
                .map(d -> montarDisciplina(studentId, d, medias, notasFinais, pontos))
                .toList();
    }

    /** Uma disciplina aparece no boletim se tem nota, nota final ou atividade pontuada no ano. */
    // ! REFB: disciplina só entra no boletim se tiver nota, nota final ou atividade pontuada
    private static Collection<Disciplina> disciplinasComLancamento(List<Nota> notas, List<Boletim> boletins, List<Entrega> pontuadas) {
        Map<Long, Disciplina> disciplinas = new HashMap<>();
        notas.forEach(n -> disciplinas.putIfAbsent(n.getDisciplina().getId(), n.getDisciplina()));
        boletins.forEach(b -> disciplinas.putIfAbsent(b.getDisciplina().getId(), b.getDisciplina()));
        pontuadas.forEach(e -> disciplinas.putIfAbsent(e.getAtividade().getDisciplina().getId(), e.getAtividade().getDisciplina()));
        return disciplinas.values();
    }

    // ! REFB: cria ou atualiza a nota final: valida faixa 0-10, se o professor leciona a disciplina e se o bimestre está aberto; avisa o responsável se mudou
    @Transactional
    public BoletimDTO lancarNotaFinal(NotaFinalRequestDTO dto, String requesterEmail) {
        validarNotaFinal(dto);
        Student student = studentRepository.findById(dto.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + dto.studentId()));
        studentAccessGuardService.assertCanTeach(student.getId(), dto.disciplinaId(), requesterEmail);
        calendarioService.exigirBimestreAberto(AnoLetivo.doAluno(student), dto.bimestre());
        Disciplina disciplina = disciplinaRepository.findById(dto.disciplinaId())
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + dto.disciplinaId()));
        User lancadoPor = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + requesterEmail));

        Boletim entity = boletimRepository.findByStudentIdAndDisciplinaIdAndBimestreAndAnoLetivo(
                        student.getId(), disciplina.getId(), dto.bimestre(), AnoLetivo.doAluno(student))
                .orElseGet(() -> new Boletim(student, disciplina, dto.bimestre()));
        Float notaAnterior = entity.getNotaFinal();
        entity.setNotaFinal(dto.notaFinal());
        entity.setLancadoPor(lancadoPor);
        entity.setLancadoEm(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        entity = boletimRepository.save(entity);

        // Só avisa o responsável quando a nota é nova ou mudou de valor.
        if (!dto.notaFinal().equals(notaAnterior)) {
            eventPublisher.publishEvent(new NotaFinalLancadaEvent(entity.getId(), notaAnterior != null));
        }
        return BoletimDTO.comNotaFinal(entity, mediaCalculada(student.getId(), disciplina.getId(), dto.bimestre()),
                pontosAtividades(student.getId(), disciplina.getId(), dto.bimestre()));
    }

    // ! REFB: nota final precisa estar entre 0 e 10 e ter bimestre
    private static void validarNotaFinal(NotaFinalRequestDTO dto) {
        if (dto.notaFinal() == null || dto.notaFinal().isNaN() || dto.notaFinal() < NOTA_MINIMA || dto.notaFinal() > NOTA_MAXIMA) {
            throw new RegraNegocioException("A nota final deve estar entre 0 e 10.");
        }
        if (dto.bimestre() == null) {
            throw new RegraNegocioException("Informe o bimestre da nota final.");
        }
    }

    // ! REFB: apaga a nota final se o professor leciona e o bimestre está aberto; cancela notificação pendente
    @Transactional
    public void removerNotaFinal(Long id, String requesterEmail) {
        Boletim entity = boletimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nota final não encontrada com o id: " + id));
        studentAccessGuardService.assertCanTeach(entity.getStudent().getId(), entity.getDisciplina().getId(), requesterEmail);
        calendarioService.exigirBimestreAberto(AnoLetivo.doAluno(entity.getStudent()), entity.getBimestre());

        boletimRepository.delete(entity);
        notificacaoService.cancelarPorReferencia(NotificacaoService.REF_BOLETIM, id, "Nota final removida antes do envio");
    }

    // ! REFB: média das notas de avaliação da disciplina no bimestre
    private Float mediaCalculada(Long studentId, Long disciplinaId, Bimestre bimestre) {
        OptionalDouble media = notaRepository.findByStudentIdAndDisciplinaIdAndBimestreAndAnoLetivo(
                        studentId, disciplinaId, bimestre, anoLetivoDoAluno(studentId)).stream()
                .mapToDouble(Nota::getRate)
                .average();
        return media.isPresent() ? (float) media.getAsDouble() : null;
    }

    // ! REFB: soma dos pontos de atividades entregues na disciplina no bimestre
    private Float pontosAtividades(Long studentId, Long disciplinaId, Bimestre bimestre) {
        Celula celula = new Celula(disciplinaId, bimestre);
        List<Entrega> daCelula = entregasPontuadas(studentId, anoLetivoDoAluno(studentId)).stream()
                .filter(e -> celulaDaEntrega(e).equals(celula))
                .toList();
        return daCelula.isEmpty() ? null : (float) daCelula.stream().mapToDouble(Entrega::getPontosObtidos).sum();
    }

    // ! REFB: entregas do aluno que receberam pontos, só do ano letivo informado
    private List<Entrega> entregasPontuadas(Long studentId, String ano) {
        return entregaRepository.findByStudentId(studentId).stream()
                .filter(e -> e.getPontosObtidos() != null)
                .filter(e -> ano.equals(e.getAtividade().getTurma().getSchoolYear().trim()))
                .toList();
    }

    // ! REFB: ano letivo da turma do aluno (ou o ano atual se não tiver turma)
    private String anoLetivoDoAluno(Long studentId) {
        Student aluno = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + studentId));
        return AnoLetivo.doAluno(aluno);
    }

    // ! REFB: chave disciplina+bimestre de uma entrega
    private static Celula celulaDaEntrega(Entrega entrega) {
        return new Celula(entrega.getAtividade().getDisciplina().getId(), entrega.getAtividade().getBimestre());
    }

    // ! REFB: monta a linha de uma disciplina com os bimestres que têm algum lançamento e a média final
    private BoletimDisciplinaDTO montarDisciplina(Long studentId, Disciplina disciplina, Map<Celula, Double> medias,
                                                  Map<Celula, Boletim> notasFinais, Map<Celula, Double> pontos) {
        List<BoletimDTO> bimestres = Arrays.stream(Bimestre.values())
                .map(b -> new Celula(disciplina.getId(), b))
                .filter(c -> medias.containsKey(c) || notasFinais.containsKey(c) || pontos.containsKey(c))
                .map(c -> montarLinha(studentId, disciplina, c.bimestre(), medias.get(c), notasFinais.get(c), pontos.get(c)))
                .toList();
        return new BoletimDisciplinaDTO(disciplina.getId(), disciplina.getTitle(), bimestres, mediaFinal(bimestres));
    }

    // ! REFB: média das notas dos bimestres que têm nota
    private Float mediaFinal(List<BoletimDTO> bimestres) {
        OptionalDouble media = bimestres.stream()
                .map(BoletimDTO::nota)
                .filter(Objects::nonNull)
                .mapToDouble(Float::doubleValue)
                .average();
        return media.isPresent() ? (float) media.getAsDouble() : null;
    }

    // ! REFB: monta um bimestre: se tem nota final usa ela, senão calcula média + pontos de atividades
    private BoletimDTO montarLinha(Long studentId, Disciplina disciplina, Bimestre bimestre, Double media,
                                   Boletim notaFinal, Double pontos) {
        Float mediaCalculada = media == null ? null : media.floatValue();
        Float pontosAtividades = pontos == null ? null : pontos.floatValue();
        if (notaFinal == null) {
            return BoletimDTO.semNotaFinal(studentId, disciplina, bimestre, mediaCalculada, pontosAtividades);
        }
        return BoletimDTO.comNotaFinal(notaFinal, mediaCalculada, pontosAtividades);
    }

    // ! REFB: chave usada nos mapas: disciplina + bimestre
    private record Celula(Long disciplinaId, Bimestre bimestre) {
    }
}
