package com.pfc.notus.notificacao.port;

import java.util.List;

/** Canal de envio das notificações (hoje: e-mail pelo Resend). A fila, o worker e o histórico não dependem do canal. */
public interface NotificadorPort {

    /** Nunca lança exceção: qualquer problema volta como ResultadoEnvio temporário ou definitivo. */
    ResultadoEnvio enviar(String email, String template, List<String> variaveis);
}
