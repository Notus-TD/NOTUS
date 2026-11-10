package com.pfc.notus.exception;

public class MuitasTentativasException extends RuntimeException {

    private final long segundosParaLiberar;

    public MuitasTentativasException(long segundosParaLiberar) {
        super(mensagem(segundosParaLiberar));
        this.segundosParaLiberar = segundosParaLiberar;
    }

    public long getSegundosParaLiberar() {
        return segundosParaLiberar;
    }

    private static String mensagem(long segundos) {
        long minutos = Math.max(1, (segundos + 59) / 60);
        return "Muitas tentativas de login. Tente de novo em " + minutos
                + (minutos == 1 ? " minuto" : " minutos") + " ou use \"Esqueci minha senha\".";
    }
}
