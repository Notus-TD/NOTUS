package com.pfc.notus.notificacao.service;

import com.pfc.notus.notificacao.event.AtividadePublicadaEvent;
import com.pfc.notus.notificacao.event.FaltaRegistradaEvent;
import com.pfc.notus.notificacao.event.NotaFinalLancadaEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class NotificacaoListener {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoListener.class);

    @Autowired
    private NotificacaoService notificacaoService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFaltaRegistrada(FaltaRegistradaEvent evento) {
        try {
            notificacaoService.notificarFalta(evento.faltaId(), evento.totalFaltasNaDisciplina());
        } catch (RuntimeException e) {
            log.error("Falha ao criar a notificação da falta {}. A falta foi salva normalmente.", evento.faltaId(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onNotaFinalLancada(NotaFinalLancadaEvent evento) {
        try {
            notificacaoService.notificarNotaFinal(evento.boletimId());
        } catch (RuntimeException e) {
            log.error("Falha ao criar a notificação da nota final {}. A nota final foi lançada normalmente.", evento.boletimId(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAtividadePublicada(AtividadePublicadaEvent evento) {
        try {
            notificacaoService.notificarAtividadePublicada(evento.atividadeId());
        } catch (RuntimeException e) {
            log.error("Falha ao criar as notificações da atividade {}. A atividade foi publicada normalmente.", evento.atividadeId(), e);
        }
    }
}
