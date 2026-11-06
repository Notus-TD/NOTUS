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
        Map<String, Object> corpo = cliente(null).montarCorpo("marta@gmail.com", "NOTUS: aviso de falta", "Olá.", null);

        assertEquals(List.of("marta@gmail.com"), corpo.get("to"));
        assertEquals("NOTUS: aviso de falta", corpo.get("subject"));
        assertEquals("Olá.", corpo.get("text"));
    }

    @Test
    void comRedirecionamentoTudoVaiParaOEnderecoDeTesteComOOriginalNoAssunto() {
        Map<String, Object> corpo = cliente(" teste@exemplo.com ").montarCorpo("marta@gmail.com", "NOTUS: aviso de falta", "Olá.", null);

        assertEquals(List.of("teste@exemplo.com"), corpo.get("to"));
        assertEquals("[para marta@gmail.com] NOTUS: aviso de falta", corpo.get("subject"));
        assertTrue(((String) corpo.get("text")).contains("o destinatário é marta@gmail.com"));
        assertTrue(((String) corpo.get("text")).endsWith("Olá."));
    }

    @Test
    void htmlTemLogoEmbutidaBotaoETextoEscapado() {
        String texto = "Olá, Marta. Nota de <Ana> & cia.\n\nPara não receber mais estes avisos, fale com a secretaria.";
        Map<String, Object> corpo = cliente(null).montarCorpo("marta@gmail.com", "NOTUS: nota", texto,
                new EmailHtml.Botao("Abrir o portal", "http://localhost:5173/login"));

        String html = (String) corpo.get("html");
        assertTrue(html.contains("cid:" + EmailHtml.CID_LOGO));
        assertTrue(html.contains("href=\"http://localhost:5173/login\""));
        assertTrue(html.contains("Abrir o portal"));
        assertTrue(html.contains("Nota de &lt;Ana&gt; &amp; cia."));
        assertFalse(html.contains("<Ana>"));
        assertEquals(texto, corpo.get("text"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> anexos = (List<Map<String, Object>>) corpo.get("attachments");
        assertEquals(EmailHtml.CID_LOGO, anexos.get(0).get("content_id"));
    }

    @Test
    void noHtmlOLinkViraBotaoESaiDoParagrafo() {
        String link = "http://localhost:5173/redefinir-senha?token=abc";
        String html = EmailHtml.montar("Abra o link abaixo:\n" + link + "\n\nMensagem automática, não responda.",
                new EmailHtml.Botao("Criar minha senha", link), true);

        assertTrue(html.contains(">Criar minha senha</a>"));
        assertFalse(html.contains("Abra o link abaixo:<br>" + link));
    }
}
