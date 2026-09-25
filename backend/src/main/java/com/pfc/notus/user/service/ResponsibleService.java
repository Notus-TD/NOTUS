package com.pfc.notus.user.service;

import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.InvalidDataException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.notificacao.util.TelefoneUtil;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.dto.ResponsibleRequest;
import com.pfc.notus.user.dto.WhatsAppOptInDTO;
import com.pfc.notus.user.repository.ResponsibleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class ResponsibleService {

    private static final Logger log = LoggerFactory.getLogger(ResponsibleService.class);

    @Autowired
    private ResponsibleRepository responsibleRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificacaoService notificacaoService;

    @Transactional
    public Responsible findOrCreateResponsible(ResponsibleRequest dto) {
        Optional<Responsible> existente = responsibleRepository.findByEmail(dto.email());
        if (existente.isPresent()) {
            return existente.get();
        }

        String telefone = TelefoneUtil.normalizar(dto.phone())
                .orElseThrow(() -> new InvalidDataException(
                        "Telefone do responsável inválido. Informe DDD + número, ex.: (11) 97777-0000"));

        Responsible responsible = new Responsible(
                dto.name(), dto.email(), telefone);

        return (Responsible) userService.register(responsible, "ROLE_RESPONSAVEL");
    }

    @Transactional(readOnly = true)
    public WhatsAppOptInDTO getOptInWhatsApp(Long responsavelId) {
        Responsible responsavel = buscar(responsavelId);
        return toOptInDTO(responsavel);
    }

    @Transactional
    public WhatsAppOptInDTO alterarOptInWhatsApp(Long responsavelId, boolean ativo) {
        Responsible responsavel = buscar(responsavelId);
        aplicarOptIn(responsavel, ativo, "portal");
        return toOptInDTO(responsavel);
    }

    @Transactional
    public void optOutPorTelefone(String telefoneE164) {
        var responsaveis = responsibleRepository.findAllByPhone(telefoneE164);
        if (responsaveis.isEmpty()) {
            log.info("Opt-out por WhatsApp de número não cadastrado: {}", TelefoneUtil.mascarar(telefoneE164));
            return;
        }
        responsaveis.forEach(r -> aplicarOptIn(r, false, "whatsapp"));
    }

    private void aplicarOptIn(Responsible responsavel, boolean ativo, String origem) {
        if (responsavel.isWhatsappOptIn() == ativo) return;
        responsavel.definirWhatsappOptIn(ativo);
        responsibleRepository.save(responsavel);
        if (!ativo) {
            notificacaoService.cancelarPendentesDoResponsavel(responsavel.getId(), "Opt-out do responsável (" + origem + ")");
        }
        log.info(AuditMarker.AUDIT, "Opt-in WhatsApp {} | responsável {} | origem: {}",
                ativo ? "ativado" : "desativado", responsavel.getId(), origem);
    }

    private Responsible buscar(Long responsavelId) {
        return responsibleRepository.findById(responsavelId)
                .orElseThrow(() -> new ResourceNotFoundException("Responsável não encontrado: " + responsavelId));
    }

    private WhatsAppOptInDTO toOptInDTO(Responsible responsavel) {
        return new WhatsAppOptInDTO(
                responsavel.isWhatsappOptIn(),
                responsavel.getWhatsappOptInEm(),
                TelefoneUtil.mascarar(responsavel.getPhone()),
                TelefoneUtil.isValido(responsavel.getPhone()));
    }
}
