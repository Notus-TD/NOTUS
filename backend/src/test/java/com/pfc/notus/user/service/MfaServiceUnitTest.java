package com.pfc.notus.user.service;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MfaServiceUnitTest {

    private static final byte[] SEGREDO_RFC = "12345678901234567890".getBytes(StandardCharsets.US_ASCII);

    private final MfaService mfaService = new MfaService("chave-de-teste-com-mais-de-trinta-e-dois-caracteres");

    @Test
    void geraOsCodigosDoAnexoBDaRfc6238() {
        assertEquals("287082", MfaService.codigo(SEGREDO_RFC, 59 / 30));
        assertEquals("081804", MfaService.codigo(SEGREDO_RFC, 1111111109L / 30));
        assertEquals("050471", MfaService.codigo(SEGREDO_RFC, 1111111111L / 30));
    }

    @Test
    void codificaEmBase32ComoOsAplicativosEsperam() {
        assertEquals("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", MfaService.base32(SEGREDO_RFC));
    }

    @Test
    void aceitaOCodigoAtualEUmPassoDeDiferenca() {
        String segredo = mfaService.novoSegredoCifrado();
        byte[] bruto = base32ParaBytes(mfaService.segredoBase32(segredo));
        long agora = 1_800_000_000L;
        long passo = agora / 30;

        assertEquals(Optional.of(passo), mfaService.validar(segredo, MfaService.codigo(bruto, passo), null, agora));
        assertEquals(Optional.of(passo - 1), mfaService.validar(segredo, MfaService.codigo(bruto, passo - 1), null, agora));
        assertTrue(mfaService.validar(segredo, MfaService.codigo(bruto, passo - 2), null, agora).isEmpty());
    }

    @Test
    void recusaCodigoJaUsado() {
        String segredo = mfaService.novoSegredoCifrado();
        byte[] bruto = base32ParaBytes(mfaService.segredoBase32(segredo));
        long agora = 1_800_000_000L;
        long passo = agora / 30;

        assertTrue(mfaService.validar(segredo, MfaService.codigo(bruto, passo), passo, agora).isEmpty());
    }

    @Test
    void recusaCodigoForaDoFormato() {
        String segredo = mfaService.novoSegredoCifrado();

        assertTrue(mfaService.validar(segredo, "12a456", null, 1_800_000_000L).isEmpty());
        assertTrue(mfaService.validar(segredo, "1234567", null, 1_800_000_000L).isEmpty());
    }

    @Test
    void guardaOSegredoCifradoEMontaAUriDoAplicativo() {
        String segredo = mfaService.novoSegredoCifrado();
        String uri = mfaService.uriCadastro(segredo, "pedro.professor@gmail.com");

        assertNotEquals(mfaService.segredoBase32(segredo), segredo);
        assertEquals("otpauth://totp/NOTUS%3Apedro.professor%40gmail.com?secret=" + mfaService.segredoBase32(segredo)
                + "&issuer=NOTUS&algorithm=SHA1&digits=6&period=30", uri);
    }

    @Test
    void recusaChaveCurta() {
        IllegalStateException excecao = assertThrows(IllegalStateException.class, () -> new MfaService("curta"));

        assertEquals("Defina a variável MFA_CHAVE com pelo menos 32 caracteres aleatórios.", excecao.getMessage());
    }

    private static byte[] base32ParaBytes(String texto) {
        String alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        byte[] saida = new byte[texto.length() * 5 / 8];
        int buffer = 0;
        int bits = 0;
        int indice = 0;
        for (char c : texto.toCharArray()) {
            buffer = (buffer << 5) | alfabeto.indexOf(c);
            bits += 5;
            if (bits >= 8) {
                saida[indice++] = (byte) ((buffer >> (bits - 8)) & 0xff);
                bits -= 8;
            }
        }
        return saida;
    }
}
