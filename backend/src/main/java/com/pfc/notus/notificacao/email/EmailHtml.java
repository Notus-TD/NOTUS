package com.pfc.notus.notificacao.email;

import java.util.ArrayList;
import java.util.List;

/**
 * Versão em HTML dos e-mails do NOTUS, montada a partir do mesmo texto da versão simples:
 * logo no topo, o texto em parágrafos, um botão de ação e o rodapé em letra menor.
 * Usa tabelas e estilos inline porque é o que os programas de e-mail (Gmail, Outlook) entendem.
 */
public final class EmailHtml {

    /** Identificador da logo anexada ao e-mail (referenciada no HTML como cid:notus-logo). */
    public static final String CID_LOGO = "notus-logo";

    private static final String AZUL = "#003c84";
    private static final String TEXTO = "#1f2937";
    private static final String TEXTO_SUAVE = "#5b6472";
    private static final String FUNDO = "#f4f7fb";
    private static final String FONTE = "'Segoe UI', Helvetica, Arial, sans-serif";

    public record Botao(String rotulo, String url) {
    }

    private EmailHtml() {
    }

    public static String montar(String texto, Botao botao, boolean comLogo) {
        List<String> corpo = new ArrayList<>();
        List<String> rodape = new ArrayList<>();

        for (String bloco : texto.split("\\n\\s*\\n")) {
            String limpo = bloco.strip();
            if (limpo.isEmpty()) continue;
            if (limpo.startsWith("Para não receber") || limpo.startsWith("Mensagem automática")) {
                rodape.add(limpo);
            } else {
                corpo.add(semLink(limpo, botao));
            }
        }

        StringBuilder html = new StringBuilder();
        html.append("<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\">")
                .append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"></head>")
                .append("<body style=\"margin:0;padding:0;background:").append(FUNDO).append(";\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:")
                .append(FUNDO).append(";padding:32px 16px;\"><tr><td align=\"center\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;")
                .append("background:#ffffff;border:1px solid #dde3ec;border-radius:16px;\">")
                .append("<tr><td style=\"padding:28px 32px 8px 32px;font-family:").append(FONTE).append(";\">");

        if (comLogo) {
            html.append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\"><tr>")
                    .append("<td style=\"vertical-align:middle;\"><img src=\"cid:").append(CID_LOGO)
                    .append("\" width=\"44\" height=\"44\" alt=\"\" style=\"display:block;border:0;\"></td>")
                    .append("<td style=\"vertical-align:middle;padding-left:10px;font-family:").append(FONTE)
                    .append(";font-size:20px;font-weight:700;color:").append(AZUL).append(";\">NOTUS</td></tr></table>");
        } else {
            html.append("<div style=\"font-size:20px;font-weight:700;color:").append(AZUL).append(";\">NOTUS</div>");
        }

        html.append("</td></tr><tr><td style=\"padding:8px 32px 8px 32px;font-family:").append(FONTE).append(";\">");
        for (String p : corpo) {
            if (p.isBlank()) continue;
            html.append("<p style=\"margin:16px 0 0 0;font-size:16px;line-height:1.55;color:").append(TEXTO).append(";\">")
                    .append(paragrafo(p)).append("</p>");
        }

        if (botao != null) {
            html.append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:28px 0 8px 0;\"><tr>")
                    .append("<td style=\"background:").append(AZUL).append(";border-radius:10px;\">")
                    .append("<a href=\"").append(atributo(botao.url())).append("\" style=\"display:inline-block;padding:13px 26px;")
                    .append("font-family:").append(FONTE).append(";font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;\">")
                    .append(escapar(botao.rotulo())).append("</a></td></tr></table>")
                    .append("<p style=\"margin:12px 0 0 0;font-size:13px;line-height:1.5;color:").append(TEXTO_SUAVE).append(";\">")
                    .append("Se o botão não abrir, copie este endereço no navegador:<br>")
                    .append("<a href=\"").append(atributo(botao.url())).append("\" style=\"color:").append(AZUL)
                    .append(";word-break:break-all;\">").append(escapar(botao.url())).append("</a></p>");
        }

        html.append("</td></tr><tr><td style=\"padding:20px 32px 28px 32px;font-family:").append(FONTE).append(";\">")
                .append("<div style=\"border-top:1px solid #e5e9f0;padding-top:16px;font-size:12px;line-height:1.5;color:")
                .append(TEXTO_SUAVE).append(";\">");
        for (String r : rodape) {
            html.append(paragrafo(r)).append("<br>");
        }
        html.append("NOTUS · Portal de gestão escolar</div></td></tr></table></td></tr></table></body></html>");
        return html.toString();
    }

    /** No HTML o link vira botão: tira do parágrafo a linha que é só o endereço. */
    private static String semLink(String bloco, Botao botao) {
        if (botao == null) return bloco;
        StringBuilder sb = new StringBuilder();
        for (String linha : bloco.split("\\n")) {
            if (linha.strip().equals(botao.url())) continue;
            if (!sb.isEmpty()) sb.append('\n');
            sb.append(linha);
        }
        return sb.toString();
    }

    private static String paragrafo(String texto) {
        return escapar(texto).replace("\n", "<br>");
    }

    private static String atributo(String texto) {
        return escapar(texto);
    }

    static String escapar(String texto) {
        return texto.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
