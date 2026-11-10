package com.pfc.notus.privacidade.service;

import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.privacidade.domain.SolicitacaoTitular;
import com.pfc.notus.privacidade.domain.StatusSolicitacao;
import com.pfc.notus.privacidade.domain.TipoSolicitacao;
import com.pfc.notus.privacidade.dto.RespostaSolicitacaoRequest;
import com.pfc.notus.privacidade.dto.SolicitacaoDTO;
import com.pfc.notus.privacidade.dto.SolicitacaoRequest;
import com.pfc.notus.privacidade.repository.SolicitacaoTitularRepository;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.repository.ResponsibleRepository;
import com.pfc.notus.user.repository.StudentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SolicitacaoTitularService {

    private static final Logger log = LoggerFactory.getLogger(SolicitacaoTitularService.class);

    @Autowired
    private SolicitacaoTitularRepository solicitacaoRepository;

    @Autowired
    private ResponsibleRepository responsibleRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Transactional
    public SolicitacaoDTO solicitar(SolicitacaoRequest request, String email) {
        Responsible responsavel = responsavelPorEmail(email);
        Student aluno = request.alunoId() == null ? null : alunoDoResponsavel(request.alunoId(), responsavel);
        if (solicitacaoRepository.existeAberta(responsavel.getId(), request.alunoId(), request.tipo(), StatusSolicitacao.ABERTA)) {
            throw new ConflictException("Já existe um pedido igual em andamento. Aguarde a resposta da secretaria.");
        }

        String detalhe = request.detalhe() == null || request.detalhe().isBlank() ? null : request.detalhe().trim();
        SolicitacaoTitular solicitacao = solicitacaoRepository.save(
                new SolicitacaoTitular(request.tipo(), responsavel, aluno, detalhe, LocalDateTime.now()));
        log.info(AuditMarker.AUDIT, "Pedido {} de {} registrado pelo responsável {} (aluno {})",
                solicitacao.getId(), solicitacao.getTipo(), responsavel.getId(), request.alunoId());
        return SolicitacaoDTO.from(solicitacao, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoDTO> listarDoResponsavel(String email) {
        Responsible responsavel = responsavelPorEmail(email);
        LocalDate hoje = LocalDate.now();
        return solicitacaoRepository.listarDoSolicitante(responsavel.getId()).stream()
                .map(s -> SolicitacaoDTO.from(s, hoje))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoDTO> listarTodas() {
        LocalDate hoje = LocalDate.now();
        return solicitacaoRepository.listarTodas().stream()
                .map(s -> SolicitacaoDTO.from(s, hoje))
                .toList();
    }

    @Transactional
    public SolicitacaoDTO responder(Long id, RespostaSolicitacaoRequest request, String adminEmail) {
        SolicitacaoTitular solicitacao = solicitacaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado com o id: " + id));
        if (!solicitacao.aberta()) {
            throw new ConflictException("Este pedido já foi respondido.");
        }
        if (request.status() == StatusSolicitacao.ABERTA) {
            throw new RegraNegocioException("Informe se o pedido foi atendido ou recusado.");
        }
        String resposta = request.resposta() == null || request.resposta().isBlank() ? null : request.resposta().trim();
        if (request.status() == StatusSolicitacao.RECUSADA && resposta == null) {
            throw new RegraNegocioException("Explique ao responsável o motivo da recusa.");
        }

        solicitacao.responder(request.status(), resposta, adminEmail, LocalDateTime.now());
        log.info(AuditMarker.AUDIT, "Pedido {} marcado como {} por {}", id, request.status(), adminEmail);
        return SolicitacaoDTO.from(solicitacao, LocalDate.now());
    }

    @Transactional
    public void atenderPorAnonimizacao(Long id, Long usuarioId, String adminEmail) {
        SolicitacaoTitular solicitacao = solicitacaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado com o id: " + id));
        if (!solicitacao.aberta()) {
            throw new ConflictException("Este pedido já foi respondido.");
        }
        if (solicitacao.getTipo() != TipoSolicitacao.ANONIMIZACAO) {
            throw new RegraNegocioException("Este pedido não é de anonimização.");
        }
        Long titular = solicitacao.getAluno() != null ? solicitacao.getAluno().getId() : solicitacao.getSolicitante().getId();
        if (!titular.equals(usuarioId)) {
            throw new RegraNegocioException("Este pedido é de outro titular.");
        }

        solicitacao.responder(StatusSolicitacao.ATENDIDA, "Dados anonimizados pela secretaria.", adminEmail, LocalDateTime.now());
        log.info(AuditMarker.AUDIT, "Pedido {} atendido por anonimização feita por {}", id, adminEmail);
    }

    private Responsible responsavelPorEmail(String email) {
        return responsibleRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Responsável não encontrado: " + email));
    }

    private Student alunoDoResponsavel(Long alunoId, Responsible responsavel) {
        Student aluno = studentRepository.findById(alunoId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado com o id: " + alunoId));
        if (aluno.getResponsible() == null || !aluno.getResponsible().getId().equals(responsavel.getId())) {
            throw new AccessDeniedException("O pedido só pode ser feito para alunos vinculados a você.");
        }
        return aluno;
    }
}
