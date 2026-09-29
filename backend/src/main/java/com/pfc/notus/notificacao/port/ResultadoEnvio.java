package com.pfc.notus.notificacao.port;

public record ResultadoEnvio(Tipo tipo, String providerMessageId, String erro) {

    public enum Tipo { SUCESSO, TEMPORARIO, DEFINITIVO }

    public static ResultadoEnvio sucesso(String providerMessageId) {
        return new ResultadoEnvio(Tipo.SUCESSO, providerMessageId, null);
    }

    public static ResultadoEnvio temporario(String erro) {
        return new ResultadoEnvio(Tipo.TEMPORARIO, null, erro);
    }

    public static ResultadoEnvio definitivo(String erro) {
        return new ResultadoEnvio(Tipo.DEFINITIVO, null, erro);
    }
}
