package com.pfc.notus.nota.service;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.calendario.service.CalendarioService;
import com.pfc.notus.boletim.domain.AnoLetivo;
import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.disciplina.domain.Disciplina;
import com.pfc.notus.disciplina.repository.DisciplinaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.nota.domain.Nota;
import com.pfc.notus.nota.dto.NotaDTO;
import com.pfc.notus.nota.dto.NotaRequestDTO;
import com.pfc.notus.nota.repository.NotaRepository;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.service.StudentAccessGuardService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// ! REFNO: Regras das notas de avaliação (provas, trabalhos): faixa 0-10, só quem leciona lança e bimestre precisa estar aberto
@Service
@RequiredArgsConstructor
public class NotaService {

    // ! REFNO: faixa permitida para a nota
    private static final float NOTA_MINIMA = 0f;
    private static final float NOTA_MAXIMA = 10f;

    // ! REFNO: repositórios de nota, aluno, disciplina, boletim + guard de permissão e calendário
    private final NotaRepository notaRepository;

    private final StudentRepository studentRepository;

    private final DisciplinaRepository disciplinaRepository;

    private final StudentAccessGuardService studentAccessGuardService;

    private final BoletimRepository boletimRepository;

    private final CalendarioService calendarioService;

    // ! REFNO: busca a nota e valida se quem pediu pode ver aquele aluno
    @Transactional(readOnly = true)
    public NotaDTO getById(Long id, String requesterEmail) {
        Nota entity = buscarNota(id);
        studentAccessGuardService.assertCanView(entity.getStudent().getId(), requesterEmail);
        return NotaDTO.from(entity);
    }

    // ! REFNO: notas do aluno no ano letivo da turma dele, em ordem de lançamento
    @Transactional(readOnly = true)
    public List<NotaDTO> getByStudent(Long studentId, String requesterEmail) {
        studentAccessGuardService.assertCanView(studentId, requesterEmail);
        Student aluno = buscarAluno(studentId);
        return notaRepository.findByStudentIdAndAnoLetivoOrderByIdAsc(studentId, AnoLetivo.doAluno(aluno)).stream()
                .map(NotaDTO::from)
                .toList();
    }

    // ! REFNO: lança a nota: valida campos, se o professor leciona a disciplina pro aluno e se o bimestre está aberto
    @Transactional
    public NotaDTO save(NotaRequestDTO dto, String requesterEmail) {
        validarAvaliacao(dto);
        Student student = buscarAluno(dto.studentId());
        studentAccessGuardService.assertCanTeach(student.getId(), dto.disciplinaId(), requesterEmail);
        Disciplina disciplina = buscarDisciplina(dto.disciplinaId());
        assertBimestreAberto(student, dto.disciplinaId(), dto.bimestre());

        Nota nota = new Nota(dto.descricao().trim(), dto.rate(), dto.bimestre());
        nota.setStudent(student);
        nota.setDisciplina(disciplina);
        nota.setAnoLetivo(AnoLetivo.doAluno(student));
        return NotaDTO.from(notaRepository.save(nota));
    }

    // ! REFNO: edita a nota; não deixa trocar aluno nem disciplina e exige bimestre aberto
    @Transactional
    public NotaDTO update(Long id, NotaRequestDTO dto, String requesterEmail) {
        validarAvaliacao(dto);
        Nota entity = buscarNota(id);
        studentAccessGuardService.assertCanTeach(entity.getStudent().getId(), entity.getDisciplina().getId(), requesterEmail);
        if (!entity.getStudent().getId().equals(dto.studentId()) || !entity.getDisciplina().getId().equals(dto.disciplinaId())) {
            throw new RegraNegocioException("Não é possível trocar o aluno ou a disciplina de uma nota.");
        }
        assertBimestreAberto(entity.getStudent(), entity.getDisciplina().getId(), entity.getBimestre());

        entity.setDescricao(dto.descricao().trim());
        entity.setRate(dto.rate());
        entity.setBimestre(dto.bimestre());
        return NotaDTO.from(notaRepository.save(entity));
    }

    // ! REFNO: apaga a nota se o professor leciona e o bimestre está aberto
    @Transactional
    public void delete(Long id, String requesterEmail) {
        Nota entity = buscarNota(id);
        studentAccessGuardService.assertCanTeach(entity.getStudent().getId(), entity.getDisciplina().getId(), requesterEmail);
        assertBimestreAberto(entity.getStudent(), entity.getDisciplina().getId(), entity.getBimestre());
        notaRepository.delete(entity);
    }

    // ! REFNO: bloqueia se o bimestre fechou no calendário OU se já tem nota final lançada no boletim para essa disciplina/bimestre
    private void assertBimestreAberto(Student student, Long disciplinaId, Bimestre bimestre) {
        calendarioService.exigirBimestreAberto(AnoLetivo.doAluno(student), bimestre);
        boolean fechado = boletimRepository
                .findByStudentIdAndDisciplinaIdAndBimestreAndAnoLetivo(
                        student.getId(), disciplinaId, bimestre, AnoLetivo.doAluno(student))
                .isPresent();
        if (fechado) {
            throw new RegraNegocioException(
                    "Este bimestre já tem nota final lançada no boletim. Remova a nota final para reabrir e corrigir as notas.");
        }
    }

    // ! REFNO: descrição obrigatória, nota entre 0 e 10 e bimestre informado
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

    // ! REFNO: busca nota ou dá 404
    private Nota buscarNota(Long id) {
        return notaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nota não encontrada com o id: " + id));
    }

    // ! REFNO: busca aluno ou dá 404
    private Student buscarAluno(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + id));
    }

    // ! REFNO: busca disciplina ou dá 404
    private Disciplina buscarDisciplina(Long id) {
        return disciplinaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o id: " + id));
    }
}
