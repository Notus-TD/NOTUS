package com.pfc.notus.user.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;

@Service
public class MfaService {

    private static final int TAMANHO_MINIMO_CHAVE = 32;
    private static final int TAMANHO_SEGREDO = 20;
    private static final int TAMANHO_IV = 12;
    private static final int PERIODO_SEGUNDOS = 30;
    private static final int DIGITOS = 6;
    private static final String EMISSOR = "NOTUS";
    private static final String ALFABETO_BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    private final SecureRandom aleatorio = new SecureRandom();
    private final SecretKeySpec chave;

    public MfaService(@Value("${security.mfa.chave}") String chave) {
        if (chave == null || chave.isBlank() || chave.length() < TAMANHO_MINIMO_CHAVE) {
            throw new IllegalStateException("Defina a variável MFA_CHAVE com pelo menos "
                    + TAMANHO_MINIMO_CHAVE + " caracteres aleatórios.");
        }
        this.chave = new SecretKeySpec(sha256(chave), "AES");
    }

    public String novoSegredoCifrado() {
        byte[] segredo = new byte[TAMANHO_SEGREDO];
        aleatorio.nextBytes(segredo);
        return cifrar(segredo);
    }

    public String segredoBase32(String segredoCifrado) {
        return base32(decifrar(segredoCifrado));
    }

    public String uriCadastro(String segredoCifrado, String email) {
        String rotulo = URLEncoder.encode(EMISSOR + ":" + email, StandardCharsets.UTF_8).replace("+", "%20");
        return "otpauth://totp/" + rotulo + "?secret=" + segredoBase32(segredoCifrado)
                + "&issuer=" + EMISSOR + "&algorithm=SHA1&digits=" + DIGITOS + "&period=" + PERIODO_SEGUNDOS;
    }

    public Optional<Long> validar(String segredoCifrado, String codigo, Long ultimoPassoUsado) {
        return validar(segredoCifrado, codigo, ultimoPassoUsado, Instant.now().getEpochSecond());
    }

    Optional<Long> validar(String segredoCifrado, String codigo, Long ultimoPassoUsado, long agoraSegundos) {
        if (segredoCifrado == null || codigo == null || !codigo.matches("\\d{" + DIGITOS + "}")) {
            return Optional.empty();
        }
        byte[] segredo = decifrar(segredoCifrado);
        long passoAtual = agoraSegundos / PERIODO_SEGUNDOS;
        for (long passo = passoAtual - 1; passo <= passoAtual + 1; passo++) {
            boolean jaUsado = ultimoPassoUsado != null && passo <= ultimoPassoUsado;
            if (!jaUsado && MessageDigest.isEqual(
                    codigo(segredo, passo).getBytes(StandardCharsets.US_ASCII),
                    codigo.getBytes(StandardCharsets.US_ASCII))) {
                return Optional.of(passo);
            }
        }
        return Optional.empty();
    }

    static String codigo(byte[] segredo, long passo) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(segredo, "HmacSHA1"));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(passo).array());
            int deslocamento = hash[hash.length - 1] & 0x0f;
            int binario = ((hash[deslocamento] & 0x7f) << 24)
                    | ((hash[deslocamento + 1] & 0xff) << 16)
                    | ((hash[deslocamento + 2] & 0xff) << 8)
                    | (hash[deslocamento + 3] & 0xff);
            return String.format("%0" + DIGITOS + "d", binario % 1_000_000);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Não foi possível calcular o código de verificação.", e);
        }
    }

    static String base32(byte[] dados) {
        StringBuilder saida = new StringBuilder();
        int buffer = 0;
        int bits = 0;
        for (byte b : dados) {
            buffer = (buffer << 8) | (b & 0xff);
            bits += 8;
            while (bits >= 5) {
                saida.append(ALFABETO_BASE32.charAt((buffer >> (bits - 5)) & 0x1f));
                bits -= 5;
            }
        }
        if (bits > 0) {
            saida.append(ALFABETO_BASE32.charAt((buffer << (5 - bits)) & 0x1f));
        }
        return saida.toString();
    }

    private String cifrar(byte[] dados) {
        try {
            byte[] iv = new byte[TAMANHO_IV];
            aleatorio.nextBytes(iv);
            Cipher cifra = Cipher.getInstance("AES/GCM/NoPadding");
            cifra.init(Cipher.ENCRYPT_MODE, chave, new GCMParameterSpec(128, iv));
            byte[] cifrado = cifra.doFinal(dados);
            return Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length + cifrado.length).put(iv).put(cifrado).array());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Não foi possível proteger o segredo do MFA.", e);
        }
    }

    private byte[] decifrar(String cifradoBase64) {
        try {
            byte[] tudo = Base64.getDecoder().decode(cifradoBase64);
            Cipher cifra = Cipher.getInstance("AES/GCM/NoPadding");
            cifra.init(Cipher.DECRYPT_MODE, chave, new GCMParameterSpec(128, Arrays.copyOfRange(tudo, 0, TAMANHO_IV)));
            return cifra.doFinal(Arrays.copyOfRange(tudo, TAMANHO_IV, tudo.length));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Não foi possível ler o segredo do MFA.", e);
        }
    }

    private static byte[] sha256(String texto) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(texto.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
