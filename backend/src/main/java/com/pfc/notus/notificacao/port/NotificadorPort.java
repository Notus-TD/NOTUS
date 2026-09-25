package com.pfc.notus.notificacao.port;

import java.util.List;

public interface NotificadorPort {

    ResultadoEnvio enviar(String destinoE164, String template, List<String> variaveis);
}
