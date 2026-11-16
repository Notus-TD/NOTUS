package com.pfc.notus.privacidade.service;

import com.pfc.notus.atividade.service.AtividadeService;
import com.pfc.notus.boletim.service.BoletimService;
import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.falta.service.FaltaService;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.privacidade.dto.DadosAlunoDTO;
import com.pfc.notus.privacidade.dto.DadosResponsavelDTO;
import com.pfc.notus.privacidade.dto.ExportacaoDadosDTO;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.dto.StudentDetalheDTO;
import com.pfc.notus.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Cópia dos dados pessoais de um titular (LGPD, art. 18, II). O pedido chega pela secretaria e o admin gera o
 * arquivo pelo painel; cada geração fica registrada na auditoria.
 */
// ! REFP: Exportação LGPD: junta cadastro, boletim, faltas, atividades e avisos do titular em um único DTO
@Service
@RequiredArgsConstructor
public class ExportacaoDadosService {

    // ! REFP: log de auditoria de cada exportação
    private static final Logger log = LoggerFactory.getLogger(ExportacaoDadosService.class);

    // ! REFP: repositório de usuário e services de boletim, falta, atividade e notificação para montar os dados
    private final UserRepository userRepository;
    private final BoletimService boletimService;
    private final FaltaService faltaService;
    private final AtividadeService atividadeService;
    private final NotificacaoService notificacaoService;

    // ! REFP: responsável: dados dele + de cada filho não anonimizado + avisos; aluno: só os dados dele; recusa se já anonimizado
    @Transactional(readOnly = true)
    public ExportacaoDadosDTO exportar(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));
        if (user.getAnonimizadoEm() != null) {
            throw new RegraNegocioException("Este cadastro já foi anonimizado: não há dados pessoais para exportar.");
        }

        ExportacaoDadosDTO dados = switch (user) {
            case Responsible responsavel -> new ExportacaoDadosDTO(
                    LocalDateTime.now(),
                    dadosDoResponsavel(responsavel),
                    responsavel.getStudents().stream()
                            .filter(s -> s.getAnonimizadoEm() == null)
                            .sorted(Comparator.comparing(Student::getFullName))
                            .map(s -> dadosDoAluno(s, adminEmail))
                            .toList(),
                    notificacaoService.avisosDoResponsavel(responsavel.getEmail()));
            case Student aluno -> new ExportacaoDadosDTO(
                    LocalDateTime.now(), null, List.of(dadosDoAluno(aluno, adminEmail)), List.of());
            default -> throw new RegraNegocioException("A cópia de dados é só para alunos e responsáveis.");
        };

        log.info(AuditMarker.AUDIT, "Cópia dos dados do usuário {} gerada por {}", userId, adminEmail);
        return dados;
    }

    // ! REFP: dados cadastrais do responsável
    private static DadosResponsavelDTO dadosDoResponsavel(Responsible r) {
        return new DadosResponsavelDTO(r.getId(), r.getName(), r.getEmail(), r.getPhone(), r.getCreatedAt(),
                r.getTermsAcceptedAt());
    }

    // ! REFP: cadastro, boletim, faltas e atividades do aluno
    private DadosAlunoDTO dadosDoAluno(Student aluno, String adminEmail) {
        return new DadosAlunoDTO(
                StudentDetalheDTO.of(aluno),
                boletimService.getByStudent(aluno.getId(), adminEmail),
                faltaService.getByStudent(aluno.getId()),
                atividadeService.getDoAluno(aluno.getId(), adminEmail)
        );
    }
}
