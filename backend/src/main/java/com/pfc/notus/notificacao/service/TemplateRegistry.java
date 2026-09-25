package com.pfc.notus.notificacao.service;

import com.pfc.notus.notificacao.domain.TipoNotificacao;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Component
public class TemplateRegistry {

    private static final int MAX_VARIAVEL = 120;

    private static final Map<TipoNotificacao, Template> TEMPLATES = Map.of(
            TipoNotificacao.FALTA, new Template("falta_aluno", 5),
            TipoNotificacao.ATIVIDADE, new Template("nova_atividade", 5),
            TipoNotificacao.BOLETIM_FECHADO, new Template("boletim_fechado", 4)
    );

    public record Template(String nome, int quantidadeVariaveis) {
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
