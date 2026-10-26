package com.pfc.notus.boletim.service;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.boletim.domain.Boletim;
import com.pfc.notus.boletim.dto.BoletimDTO;
import com.pfc.notus.boletim.dto.BoletimDisciplinaDTO;
import com.pfc.notus.boletim.dto.NotaFinalRequestDTO;
import com.pfc.notus.boletim.mapper.BoletimMapper;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisiciplinaRepository;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
public class BoletimService {

    private static final float NOTA_MINIMA = 0f;
    private static final float NOTA_MAXIMA = 10f;

    @Autowired
    private BoletimRepository boletimRepository;

    @Autowired
    private NotaRepository notaRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DisiciplinaRepository disciplinaRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentAccessGuardService studentAccessGuardService;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<BoletimDisciplinaDTO> getByStudent(Long studentId, String requesterEmail) {
        studentAccessGuardService.assertCanView(studentId, requesterEmail);

        List<Nota> notas = notaRepository.findByStudentIdOrderByIdAsc(studentId);
        List<Boletim> boletins = boletimRepository.findByStudentId(studentId);

        Map<Long, Disciplina> disciplinas = new HashMap<>();
        notas.forEach(n -> disciplinas.putIfAbsent(n.getDisciplina().getId(), n.getDisciplina()));
        boletins.forEach(b -> disciplinas.putIfAbsent(b.getDisciplina().getId(), b.getDisciplina()));

        Map<Celula, Double> medias = notas.stream()
                .collect(Collectors.groupingBy(n -> new Celula(n.getDisciplina().getId(), n.getBimestre()),
                        Collectors.averagingDouble(Nota::getRate)));
        Map<Celula, Boletim> notasFinais = boletins.stream()
                .collect(Collectors.toMap(b -> new Celula(b.getDisciplina().getId(), b.getBimestre()), Function.identity()));

        return disciplinas.values().stream()
                .sorted(Comparator.comparing(Disciplina::getTitle))
                .map(d -> montarDisciplina(studentId, d, medias, notasFinais))
                .toList();
    }

    @Transactional
    public BoletimDTO lancarNotaFinal(NotaFinalRequestDTO dto, String requesterEmail) {
        if (dto.notaFinal() == null || dto.notaFinal().isNaN() || dto.notaFinal() < NOTA_MINIMA || dto.notaFinal() > NOTA_MAXIMA) {
            throw new RegraNegocioException("A nota final deve estar entre 0 e 10.");
        }
        if (dto.bimestre() == null) {
            throw new RegraNegocioException("Informe o bimestre da nota final.");
        }
        Student student = studentRepository.findById(dto.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + dto.studentId()));
        studentAccessGuardService.assertCanTeach(student.getId(), dto.disciplinaId(), requesterEmail);
        Disciplina disciplina = disciplinaRepository.findById(dto.disciplinaId())
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + dto.disciplinaId()));
        User lancadoPor = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + requesterEmail));

        Boletim entity = boletimRepository.findByStudentIdAndDisciplinaIdAndBimestre(student.getId(), disciplina.getId(), dto.bimestre())
                .orElseGet(() -> new Boletim(student, disciplina, dto.bimestre()));
        entity.setNotaFinal(dto.notaFinal());
        entity.setLancadoPor(lancadoPor);
        entity.setLancadoEm(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        entity = boletimRepository.save(entity);

        eventPublisher.publishEvent(new NotaFinalLancadaEvent(entity.getId()));
        return BoletimMapper.toDto(entity, mediaCalculada(student.getId(), disciplina.getId(), dto.bimestre()));
    }

    @Transactional
    public void removerNotaFinal(Long id, String requesterEmail) {
        Boletim entity = boletimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nota final não encontrada com o id: " + id));
        studentAccessGuardService.assertCanTeach(entity.getStudent().getId(), entity.getDisciplina().getId(), requesterEmail);

        boletimRepository.delete(entity);
        notificacaoService.cancelarPorReferencia(NotificacaoService.REF_BOLETIM, id, "Nota final removida antes do envio");
    }

    private Float mediaCalculada(Long studentId, Long disciplinaId, Bimestre bimestre) {
        OptionalDouble media = notaRepository.findByStudentIdAndDisciplinaIdAndBimestre(studentId, disciplinaId, bimestre).stream()
                .mapToDouble(Nota::getRate)
                .average();
        return media.isPresent() ? (float) media.getAsDouble() : null;
    }

    private BoletimDisciplinaDTO montarDisciplina(Long studentId, Disciplina disciplina,
                                                  Map<Celula, Double> medias, Map<Celula, Boletim> notasFinais) {
        List<BoletimDTO> bimestres = Arrays.stream(Bimestre.values())
                .map(b -> new Celula(disciplina.getId(), b))
                .filter(c -> medias.containsKey(c) || notasFinais.containsKey(c))
                .map(c -> montarLinha(studentId, disciplina, c.bimestre(), medias.get(c), notasFinais.get(c)))
                .toList();
        return BoletimMapper.toDisciplinaDto(disciplina, bimestres,
                mediaDasNotas(bimestres, b -> b.getSemestre() == 1),
                mediaDasNotas(bimestres, b -> b.getSemestre() == 2),
                mediaDasNotas(bimestres, b -> true));
    }

    private Float mediaDasNotas(List<BoletimDTO> bimestres, Predicate<Bimestre> filtro) {
        OptionalDouble media = bimestres.stream()
                .filter(b -> filtro.test(b.bimestre()))
                .mapToDouble(BoletimDTO::nota)
                .average();
        return media.isPresent() ? (float) media.getAsDouble() : null;
    }

    private BoletimDTO montarLinha(Long studentId, Disciplina disciplina, Bimestre bimestre, Double media, Boletim notaFinal) {
        Float mediaCalculada = media == null ? null : media.floatValue();
        if (notaFinal == null) {
            return BoletimMapper.toDtoSemNotaFinal(studentId, disciplina, bimestre, mediaCalculada);
        }
        return BoletimMapper.toDto(notaFinal, mediaCalculada);
    }

    private record Celula(Long disciplinaId, Bimestre bimestre) {
    }
}
