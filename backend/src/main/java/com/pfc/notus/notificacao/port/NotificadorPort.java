package com.pfc.notus.notificacao.port;

import java.util.List;

public interface NotificadorPort {

    ResultadoEnvio enviar(String email, String template, List<String> variaveis);
}
