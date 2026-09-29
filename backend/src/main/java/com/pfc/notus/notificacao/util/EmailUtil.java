package com.pfc.notus.notificacao.util;

public final class EmailUtil {

    private EmailUtil() {
    }

    /** Mascara o e-mail para logs e histórico: marta.responsavel@gmail.com -> mar***@gmail.com. */
    public static String mascarar(String email) {
        if (email == null || !email.contains("@")) return "****";
        int arroba = email.indexOf('@');
        String usuario = email.substring(0, arroba);
        return usuario.substring(0, Math.min(3, usuario.length())) + "***" + email.substring(arroba);
    }
}
