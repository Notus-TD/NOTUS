package com.pfc.notus.privacidade.service;

import com.pfc.notus.atividade.service.AtividadeService;
import com.pfc.notus.boletim.service.BoletimService;
import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.falta.service.FaltaService;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.privacidade.dto.DadosAlunoDTO;
import com.pfc.notus.privacidade.dto.DadosResponsavelDTO;
import com.pfc.notus.privacidade.dto.ExportacaoDadosDTO;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.dto.StudentDetalheDTO;
import com.pfc.notus.user.repository.ResponsibleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class ExportacaoDadosService {

    private static final Logger log = LoggerFactory.getLogger(ExportacaoDadosService.class);

    @Autowired
    private ResponsibleRepository responsibleRepository;

    @Autowired
    private BoletimService boletimService;

    @Autowired
    private FaltaService faltaService;

    @Autowired
    private AtividadeService atividadeService;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private SolicitacaoTitularService solicitacaoTitularService;

    @Transactional(readOnly = true)
    public ExportacaoDadosDTO exportarDoResponsavel(String email) {
        Responsible responsavel = responsibleRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Responsável não encontrado: " + email));

        List<DadosAlunoDTO> alunos = responsavel.getStudents().stream()
                .filter(s -> s.getAnonimizadoEm() == null)
                .sorted(Comparator.comparing(Student::getFullName))
                .map(s -> dadosDoAluno(s, email))
                .toList();

        log.info(AuditMarker.AUDIT, "Responsável {} baixou a cópia dos dados da família", responsavel.getId());
        return new ExportacaoDadosDTO(
                LocalDateTime.now(),
                new DadosResponsavelDTO(responsavel.getId(), responsavel.getName(), responsavel.getEmail(),
                        responsavel.getPhone(), responsavel.getCreatedAt(), responsavel.getTermsAcceptedAt()),
                alunos,
                notificacaoService.avisosDoResponsavel(email),
                solicitacaoTitularService.listarDoResponsavel(email)
        );
    }

    private DadosAlunoDTO dadosDoAluno(Student aluno, String email) {
        return new DadosAlunoDTO(
                StudentDetalheDTO.of(aluno),
                boletimService.getByStudent(aluno.getId(), email),
                faltaService.getByStudent(aluno.getId()),
                atividadeService.getDoAluno(aluno.getId(), email)
        );
    }
}
