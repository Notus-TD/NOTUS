package com.pfc.notus.notificacao.email;

import com.pfc.notus.notificacao.config.ResendProperties;
import com.pfc.notus.notificacao.service.TemplateRegistry;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ResendEmailClientUnitTest {

    private static ResendEmailClient cliente(String redirecionarPara) {
        return new ResendEmailClient(new ResendProperties("chave", null, null, redirecionarPara), new TemplateRegistry());
    }

    @Test
    void semRedirecionamentoEnviaParaODestinatarioReal() {
        Map<String, Object> corpo = cliente(null).montarCorpo("marta@gmail.com", "NOTUS: aviso de falta", "Olá.");

        assertEquals(List.of("marta@gmail.com"), corpo.get("to"));
        assertEquals("NOTUS: aviso de falta", corpo.get("subject"));
        assertEquals("Olá.", corpo.get("text"));
    }

    @Test
    void comRedirecionamentoTudoVaiParaOEnderecoDeTesteComOOriginalNoAssunto() {
        Map<String, Object> corpo = cliente(" teste@exemplo.com ").montarCorpo("marta@gmail.com", "NOTUS: aviso de falta", "Olá.");

        assertEquals(List.of("teste@exemplo.com"), corpo.get("to"));
        assertEquals("[para marta@gmail.com] NOTUS: aviso de falta", corpo.get("subject"));
        assertTrue(((String) corpo.get("text")).contains("o destinatário é marta@gmail.com"));
        assertTrue(((String) corpo.get("text")).endsWith("Olá."));
    }
}
