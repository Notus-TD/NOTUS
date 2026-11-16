package com.pfc.notus.notificacao.domain;

// ! REFN: Ciclo de vida do aviso: PENDENTE -> ENVIANDO -> ENVIADA (ou FALHA); CANCELADA quando o motivo deixa de existir
public enum StatusNotificacao {
    PENDENTE,
    ENVIANDO,
    ENVIADA,
    ENTREGUE,
    LIDA,
    FALHA,
    CANCELADA
}
