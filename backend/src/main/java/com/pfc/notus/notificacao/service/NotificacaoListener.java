package com.pfc.notus.notificacao.service;

import com.pfc.notus.notificacao.event.BoletimFechadoEvent;
import com.pfc.notus.notificacao.event.FaltaRegistradaEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Cria as notificações só depois do commit da falta ou do boletim.
 * A operação principal já está salva quando isto roda, então um erro aqui
 * nunca desfaz a falta/boletim nem vira 500: vira apenas uma linha de log.
 */
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
    public void onBoletimFechado(BoletimFechadoEvent evento) {
        try {
            notificacaoService.notificarBoletimFechado(evento.boletimId());
        } catch (RuntimeException e) {
            log.error("Falha ao criar a notificação do boletim {}. O boletim foi fechado normalmente.", evento.boletimId(), e);
        }
    }
}
