package com.pfc.notus.notificacao.util;

import java.util.Optional;
import java.util.regex.Pattern;

public final class TelefoneUtil {

    private static final Pattern E164_BR = Pattern.compile("^\\+55[1-9][0-9](9[0-9]{8}|[2-8][0-9]{7})$");

    private TelefoneUtil() {
    }

    public static Optional<String> normalizar(String telefone) {
        if (telefone == null) return Optional.empty();
        String digitos = telefone.replaceAll("\\D", "").replaceFirst("^0+", "");
        if (digitos.length() == 10 || digitos.length() == 11) {
            digitos = "55" + digitos;
        }
        String e164 = "+" + digitos;
        return E164_BR.matcher(e164).matches() ? Optional.of(e164) : Optional.empty();
    }

    public static boolean isValido(String e164) {
        return e164 != null && E164_BR.matcher(e164).matches();
    }

    public static String paraWhatsApp(String e164) {
        return e164.startsWith("+") ? e164.substring(1) : e164;
    }

    public static String mascarar(String telefone) {
        if (telefone == null || telefone.length() < 8) return "****";
        return telefone.substring(0, 3) + "*".repeat(telefone.length() - 7) + telefone.substring(telefone.length() - 4);
    }
}
