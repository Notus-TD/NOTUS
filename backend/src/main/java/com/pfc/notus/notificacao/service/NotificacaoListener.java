package com.pfc.notus.notificacao.service;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.notificacao.event.AtividadePublicadaEvent;
import com.pfc.notus.notificacao.event.ComunicadoPublicadoEvent;
import com.pfc.notus.notificacao.event.FaltaRegistradaEvent;
import com.pfc.notus.notificacao.event.NotaFinalLancadaEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

// ! REFN: Ouve os eventos (falta, nota final, comunicado, atividade) depois do commit e manda criar os avisos; erro aqui não desfaz o que foi salvo
@Component
@RequiredArgsConstructor
public class NotificacaoListener {

    // ! REFN: log de erro caso a criação do aviso falhe
    private static final Logger log = LoggerFactory.getLogger(NotificacaoListener.class);

    // ! REFN: service que cria os avisos e worker que tenta enviar na hora
    private final NotificacaoService notificacaoService;

    private final NotificacaoWorker worker;

    // ! REFN: falta salva -> cria aviso de falta e dispara o envio
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFaltaRegistrada(FaltaRegistradaEvent evento) {
        try {
            notificacaoService.notificarFalta(evento.faltaId(), evento.totalFaltasNaDisciplina());
            worker.processarAgora();
        } catch (RuntimeException e) {
            log.error("Falha ao criar a notificação da falta {}. A falta foi salva normalmente.", evento.faltaId(), e);
        }
    }

    // ! REFN: nota final salva -> cria aviso (novo ou atualizado) e dispara o envio
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onNotaFinalLancada(NotaFinalLancadaEvent evento) {
        try {
            notificacaoService.notificarNotaFinal(evento.boletimId(), evento.atualizada());
            worker.processarAgora();
        } catch (RuntimeException e) {
            log.error("Falha ao criar a notificação da nota final {}. A nota final foi lançada normalmente.", evento.boletimId(), e);
        }
    }

    // ! REFN: comunicado salvo -> cria um aviso por responsável e dispara o envio
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onComunicadoPublicado(ComunicadoPublicadoEvent evento) {
        try {
            notificacaoService.notificarComunicado(evento.comunicadoId());
            worker.processarAgora();
        } catch (RuntimeException e) {
            log.error("Falha ao criar as notificações do comunicado {}. O comunicado foi publicado normalmente.", evento.comunicadoId(), e);
        }
    }

    // ! REFN: atividade salva -> cria avisos para a turma e dispara o envio
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAtividadePublicada(AtividadePublicadaEvent evento) {
        try {
            notificacaoService.notificarAtividadePublicada(evento.atividadeId());
            worker.processarAgora();
        } catch (RuntimeException e) {
            log.error("Falha ao criar as notificações da atividade {}. A atividade foi publicada normalmente.", evento.atividadeId(), e);
        }
    }
}
