package com.pfc.notus.privacidade.service;

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
import com.pfc.notus.privacidade.dto.SolicitacaoDTO;
import com.pfc.notus.privacidade.repository.RegistroAnonimizacaoRepository;
import com.pfc.notus.privacidade.repository.SolicitacaoTitularRepository;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@Service
public class AnonimizacaoService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private SolicitacaoTitularService solicitacaoTitularService;

    @Autowired
    private SolicitacaoTitularRepository solicitacaoRepository;

    @Autowired
    private RegistroAnonimizacaoRepository registroRepository;

    @Autowired
    private BoletimRepository boletimRepository;

    @Autowired
    private FaltaRepository faltaRepository;

    @Autowired
    private EntregaRepository entregaRepository;

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @Transactional(readOnly = true)
    public ResumoAnonimizacaoDTO resumo(Long userId) {
        User user = buscarTitular(userId);
        LocalDate hoje = LocalDate.now();
        List<SolicitacaoDTO> pedidos = solicitacaoRepository.listarAbertasDoUsuario(userId).stream()
                .map(s -> SolicitacaoDTO.from(s, hoje))
                .toList();
        RegistroAnonimizacaoDTO registro = registroRepository.findFirstByUsuarioIdOrderByExecutadoEmDesc(userId)
                .map(RegistroAnonimizacaoDTO::from)
                .orElse(null);

        if (user instanceof Student aluno) {
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
                    pedidos, aluno.getAnonimizadoEm(), registro, bloqueio);
        }

        Responsible responsavel = (Responsible) user;
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
                pedidos, responsavel.getAnonimizadoEm(), registro, bloqueio);
    }

    @Transactional
    public RegistroAnonimizacaoDTO anonimizar(Long userId, AnonimizarRequest request, String adminEmail) {
        String detalhe = request.detalhe() == null || request.detalhe().isBlank() ? null : request.detalhe().trim();
        if (request.motivo() == MotivoAnonimizacao.OUTRO && detalhe == null) {
            throw new RegraNegocioException("Descreva o motivo da anonimização.");
        }
        if (request.motivo() == MotivoAnonimizacao.PEDIDO_DO_TITULAR && request.solicitacaoId() == null) {
            throw new RegraNegocioException("Escolha o pedido do titular que está sendo atendido.");
        }
        User user = buscarTitular(userId);
        String perfil = user instanceof Student ? "ALUNO" : "RESPONSAVEL";
        Long matricula = user instanceof Student aluno ? aluno.getMatricula() : null;

        if (request.solicitacaoId() != null) {
            solicitacaoTitularService.atenderPorAnonimizacao(request.solicitacaoId(), userId, adminEmail);
        }
        userService.anonimyzeUser(userId, request.confirmacao(), adminEmail);

        RegistroAnonimizacao registro = registroRepository.save(new RegistroAnonimizacao(userId, perfil, matricula,
                request.motivo(), detalhe, request.solicitacaoId(), adminEmail,
                LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS)));
        return RegistroAnonimizacaoDTO.from(registro);
    }

    @Transactional(readOnly = true)
    public List<RegistroAnonimizacaoDTO> historico() {
        return registroRepository.findAllByOrderByExecutadoEmDesc().stream()
                .map(RegistroAnonimizacaoDTO::from)
                .toList();
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
