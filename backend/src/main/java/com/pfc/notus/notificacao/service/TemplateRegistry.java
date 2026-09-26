package com.pfc.notus.notificacao.service;

import com.pfc.notus.notificacao.domain.TipoNotificacao;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Component
public class TemplateRegistry {

    private static final int MAX_VARIAVEL = 120;

    private static final String RODAPE = "\n\nPara não receber mais estes avisos, fale com a secretaria."
            + "\nMensagem automática, não responda.";

    // Texto de cada aviso; as variáveis {{n}} são preenchidas em renderizar().
    private static final Map<TipoNotificacao, Template> TEMPLATES = Map.of(
            TipoNotificacao.FALTA, new Template("falta_aluno", 5,
                    "Olá, {{1}}. Registramos uma falta de {{2}} em {{3}} no dia {{4}}.\n"
                            + "Total de faltas nesta disciplina: {{5}}." + RODAPE),
            TipoNotificacao.ATIVIDADE, new Template("nova_atividade", 5,
                    "Olá, {{1}}. Há uma nova atividade de {{3}} para {{2}}: \"{{4}}\".\n"
                            + "Prazo: {{5}}." + RODAPE),
            TipoNotificacao.BOLETIM_FECHADO, new Template("boletim_fechado", 4,
                    "Olá, {{1}}. O boletim de {{2}} do período {{3}} foi fechado.\n"
                            + "Média final: {{4}}." + RODAPE)
    );

    public record Template(String nome, int quantidadeVariaveis, String texto) {
    }

    private static final Map<String, String> ASSUNTOS = Map.of(
            "falta_aluno", "NOTUS: aviso de falta",
            "nova_atividade", "NOTUS: nova atividade",
            "boletim_fechado", "NOTUS: boletim fechado"
    );

    /** Assunto do e-mail para o template. */
    public String assunto(String nomeTemplate) {
        return ASSUNTOS.getOrDefault(nomeTemplate, "NOTUS: aviso escolar");
    }

    /** Monta o texto final do aviso com as variáveis. */
    public String renderizar(String nomeTemplate, List<String> variaveis) {
        Template template = TEMPLATES.values().stream()
                .filter(t -> t.nome().equals(nomeTemplate))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Template desconhecido: " + nomeTemplate));
        String texto = template.texto();
        for (int i = 0; i < variaveis.size(); i++) {
            texto = texto.replace("{{" + (i + 1) + "}}", variaveis.get(i));
        }
        return texto;
    }

    public Template template(TipoNotificacao tipo) {
        Template template = TEMPLATES.get(tipo);
        if (template == null) {
            throw new IllegalArgumentException("Nenhum template configurado para " + tipo);
        }
        return template;
    }

    public List<String> variaveis(TipoNotificacao tipo, String... valores) {
        Template template = template(tipo);
        if (valores.length != template.quantidadeVariaveis()) {
            throw new IllegalArgumentException("Template " + template.nome() + " espera "
                    + template.quantidadeVariaveis() + " variáveis, recebeu " + valores.length);
        }
        return Arrays.stream(valores).map(TemplateRegistry::limpar).toList();
    }

    private static String limpar(String valor) {
        if (valor == null || valor.isBlank()) return "-";
        String limpo = valor.replaceAll("[\\r\\n\\t]+", " ").replaceAll(" {2,}", " ").trim();
        if (limpo.length() > MAX_VARIAVEL) {
            limpo = limpo.substring(0, MAX_VARIAVEL - 3).trim() + "...";
        }
        return limpo;
    }
}
