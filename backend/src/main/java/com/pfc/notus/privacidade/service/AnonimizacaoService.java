package com.pfc.notus.privacidade.service;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.boletim.repository.BoletimRepository;
import com.pfc.notus.entrega.repository.EntregaRepository;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.falta.repository.FaltaRepository;
import com.pfc.notus.notificacao.repository.NotificacaoRepository;
import com.pfc.notus.privacidade.domain.MotivoAnonimizacao;
import com.pfc.notus.privacidade.domain.RegistroAnonimizacao;
import com.pfc.notus.privacidade.dto.AnonimizarRequest;
import com.pfc.notus.privacidade.dto.FilhoResumoDTO;
import com.pfc.notus.privacidade.dto.RegistroAnonimizacaoDTO;
import com.pfc.notus.privacidade.dto.ResumoAnonimizacaoDTO;
import com.pfc.notus.privacidade.repository.RegistroAnonimizacaoRepository;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnonimizacaoService {

    private final UserRepository userRepository;

    private final UserService userService;
    private final RegistroAnonimizacaoRepository registroRepository;

    private final BoletimRepository boletimRepository;

    private final FaltaRepository faltaRepository;

    private final EntregaRepository entregaRepository;

    private final NotificacaoRepository notificacaoRepository;

    @Transactional(readOnly = true)
    public ResumoAnonimizacaoDTO resumo(Long userId) {
        User user = buscarTitular(userId);
        RegistroAnonimizacaoDTO registro = registroRepository.findFirstByUsuarioIdOrderByExecutadoEmDesc(userId)
                .map(RegistroAnonimizacaoDTO::from)
                .orElse(null);

        return switch (user) {
            case Student aluno -> resumoDoAluno(aluno, registro);
            case Responsible responsavel -> resumoDoResponsavel(responsavel, registro);
            default -> throw new IllegalStateException("buscarTitular só devolve aluno ou responsável");
        };
    }

    /** O que será apagado do aluno e quantos registros escolares ficam (notas, faltas, entregas). */
    private ResumoAnonimizacaoDTO resumoDoAluno(Student aluno, RegistroAnonimizacaoDTO registro) {
        String bloqueio = aluno.getAnonimizadoEm() == null && aluno.getStatusMatricula() == StatusMatricula.ATIVA
                ? "Cancele a matrícula do aluno antes de anonimizar."
                : null;
        return new ResumoAnonimizacaoDTO(aluno.getId(), "ALUNO", aluno.getFullName(), aluno.getEmail(),
                aluno.getMatricula(), aluno.getStatusMatricula(),
                aluno.getTurma() == null ? null : aluno.getTurma().getName(),
                aluno.getResponsible() == null ? null : aluno.getResponsible().getName(),
                aluno.getAcessoLiberadoEm() != null, aluno.getMotivoCancelamento(),
                aluno.getMatriculaCanceladaEm(), List.of(),
                boletimRepository.countByStudentId(aluno.getId()), faltaRepository.countByAlunoId(aluno.getId()),
                entregaRepository.countByStudentId(aluno.getId()), notificacaoRepository.countByStudentId(aluno.getId()),
                aluno.getAnonimizadoEm(), registro, bloqueio);
    }

    /** O responsável só pode ser anonimizado quando nenhum filho tem matrícula ativa. */
    private ResumoAnonimizacaoDTO resumoDoResponsavel(Responsible responsavel, RegistroAnonimizacaoDTO registro) {
        List<FilhoResumoDTO> filhos = responsavel.getStudents().stream()
                .sorted(Comparator.comparing(Student::getMatricula))
                .map(f -> new FilhoResumoDTO(f.getId(), f.getFullName(), f.getMatricula(), f.getStatusMatricula(),
                        f.getAnonimizadoEm() != null))
                .toList();
        List<String> ativos = filhos.stream()
                .filter(f -> f.matriculaStatus() == StatusMatricula.ATIVA)
                .map(FilhoResumoDTO::nome)
                .toList();
        String bloqueio = responsavel.getAnonimizadoEm() == null && !ativos.isEmpty()
                ? "O responsável tem aluno com matrícula ativa: " + String.join(", ", ativos) + "."
                : null;
        return new ResumoAnonimizacaoDTO(responsavel.getId(), "RESPONSAVEL", responsavel.getName(), responsavel.getEmail(),
                null, null, null, null, false, null, null, filhos, 0, 0, 0,
                notificacaoRepository.countByResponsavelId(responsavel.getId()),
                responsavel.getAnonimizadoEm(), registro, bloqueio);
    }

    @Transactional
    public RegistroAnonimizacaoDTO anonimizar(Long userId, AnonimizarRequest request, String adminEmail) {
        String detalhe = request.detalhe() == null || request.detalhe().isBlank() ? null : request.detalhe().trim();
        exigirDetalheQuandoPrecisa(request.motivo(), detalhe);
        User user = buscarTitular(userId);
        String perfil = user instanceof Student ? "ALUNO" : "RESPONSAVEL";
        Long matricula = user instanceof Student aluno ? aluno.getMatricula() : null;
        userService.anonymizeUser(userId, request.confirmacao(), adminEmail);

        RegistroAnonimizacao registro = registroRepository.save(new RegistroAnonimizacao(userId, perfil, matricula,
                request.motivo(), detalhe, adminEmail,
                LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS)));
        return RegistroAnonimizacaoDTO.from(registro);
    }

    @Transactional(readOnly = true)
    public List<RegistroAnonimizacaoDTO> historico() {
        return registroRepository.findAllByOrderByExecutadoEmDesc().stream()
                .map(RegistroAnonimizacaoDTO::from)
                .toList();
    }

    /**
     * "Outro" e "Pedido do titular" precisam de descrição. O pedido do titular chega pela secretaria
     * (fluxo manual): o admin registra como e quando foi feito.
     */
    private static void exigirDetalheQuandoPrecisa(MotivoAnonimizacao motivo, String detalhe) {
        if (motivo == MotivoAnonimizacao.OUTRO && detalhe == null) {
            throw new RegraNegocioException("Descreva o motivo da anonimização.");
        }
        if (motivo == MotivoAnonimizacao.PEDIDO_DO_TITULAR && detalhe == null) {
            throw new RegraNegocioException("Descreva como e quando o titular fez o pedido.");
        }
    }

    private User buscarTitular(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));
        if (!(user instanceof Student) && !(user instanceof Responsible)) {
            throw new RegraNegocioException("Só alunos e responsáveis podem ser anonimizados.");
        }
        return user;
    }
}
