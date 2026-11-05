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

    private static final Map<TipoNotificacao, Template> TEMPLATES = Map.of(
            TipoNotificacao.FALTA, new Template("falta_aluno", 5,
                    "Olá, {{1}}. Registramos uma falta de {{2}} em {{3}} no dia {{4}}.\n"
                            + "Total de faltas nesta disciplina: {{5}}." + RODAPE),
            TipoNotificacao.ATIVIDADE, new Template("nova_atividade", 5,
                    "Olá, {{1}}. Há uma nova atividade de {{3}} para {{2}}: \"{{4}}\".\n"
                            + "Prazo: {{5}}." + RODAPE),
            TipoNotificacao.NOTA_FINAL, new Template("nota_final", 5,
                    "Olá, {{1}}. A nota final de {{2}} em {{3}} no {{4}} foi lançada.\n"
                            + "Nota final: {{5}}." + RODAPE),
            TipoNotificacao.COMUNICADO, new Template("comunicado", 2,
                    "Olá, {{1}}. A escola publicou um novo comunicado: \"{{2}}\".\n"
                            + "Leia a mensagem completa no portal NOTUS." + RODAPE)
    );

    /** Variações de texto de um mesmo tipo (mesmas variáveis do template padrão do tipo). */
    private static final List<Template> VARIACOES = List.of(
            new Template("nota_atualizada", 5,
                    "Olá, {{1}}. A nota final de {{2}} em {{3}} no {{4}} foi atualizada.\n"
                            + "Nova nota final: {{5}}." + RODAPE)
    );

    public record Template(String nome, int quantidadeVariaveis, String texto) {
    }

    private static final Map<String, String> ASSUNTOS = Map.of(
            "falta_aluno", "NOTUS: aviso de falta",
            "nova_atividade", "NOTUS: nova atividade",
            "nota_final", "NOTUS: nota final lançada",
            "nota_atualizada", "NOTUS: nota final atualizada",
            "comunicado", "NOTUS: novo comunicado da escola"
    );

    /** Títulos curtos mostrados nos avisos do portal (sem o prefixo do e-mail). */
    private static final Map<String, String> TITULOS = Map.of(
            "falta_aluno", "Falta registrada",
            "nova_atividade", "Nova atividade",
            "nota_final", "Nota lançada",
            "nota_atualizada", "Nota atualizada",
            "comunicado", "Comunicado da escola"
    );

    public String titulo(String nomeTemplate) {
        return TITULOS.getOrDefault(nomeTemplate, "Aviso da escola");
    }

    public Template porNome(String nomeTemplate) {
        return java.util.stream.Stream.concat(TEMPLATES.values().stream(), VARIACOES.stream())
                .filter(t -> t.nome().equals(nomeTemplate))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Template desconhecido: " + nomeTemplate));
    }

    /** Texto para mostrar dentro do portal: o mesmo do e-mail, sem o rodapé de mensagem automática. */
    public String renderizarParaPortal(String nomeTemplate, List<String> variaveis) {
        String texto = renderizar(nomeTemplate, variaveis);
        return texto.endsWith(RODAPE) ? texto.substring(0, texto.length() - RODAPE.length()) : texto;
    }

    public String assunto(String nomeTemplate) {
        return ASSUNTOS.getOrDefault(nomeTemplate, "NOTUS: aviso escolar");
    }

    public String renderizar(String nomeTemplate, List<String> variaveis) {
        String texto = porNome(nomeTemplate).texto();
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
