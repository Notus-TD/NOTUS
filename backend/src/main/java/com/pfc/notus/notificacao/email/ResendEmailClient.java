package com.pfc.notus.notificacao.email;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.pfc.notus.notificacao.config.ResendProperties;
import com.pfc.notus.notificacao.port.NotificadorPort;
import com.pfc.notus.notificacao.port.ResultadoEnvio;
import com.pfc.notus.notificacao.service.TemplateRegistry;
import com.pfc.notus.notificacao.util.EmailUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.io.IOException;
import java.io.InputStream;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ResendEmailClient implements NotificadorPort {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailClient.class);

    private static final String LOGO = "email/notus-marca.png";

    private final ResendProperties properties;
    private final TemplateRegistry templateRegistry;
    private final RestClient restClient;
    private final String urlPortal;
    private final String logoBase64;

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RespostaEnvio(String id) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RespostaErro(String name, String message) {
    }

    @Autowired
    public ResendEmailClient(ResendProperties properties, TemplateRegistry templateRegistry,
                             @Value("${app.frontend-url}") String frontendUrl) {
        this.properties = properties;
        this.templateRegistry = templateRegistry;
        this.urlPortal = frontendUrl.replaceAll("/+$", "") + "/login";
        this.logoBase64 = carregarLogo();

        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(15));

        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .requestFactory(requestFactory)
                .defaultHeader("Authorization", "Bearer " + properties.apiKey())
                .build();

        if (!properties.credenciaisConfiguradas()) {
            log.warn("RESEND_API_KEY não configurada: as notificações vão ficar com status FALHA.");
        }
        if (properties.redirecionamentoAtivo()) {
            log.warn("RESEND_REDIRECIONAR_PARA ativo: todos os e-mails vão para {} (só para desenvolvimento).",
                    EmailUtil.mascarar(properties.redirecionarPara()));
        }
    }

    ResendEmailClient(ResendProperties properties, TemplateRegistry templateRegistry) {
        this(properties, templateRegistry, "http://localhost:5173");
    }

    private static String carregarLogo() {
        try (InputStream in = new ClassPathResource(LOGO).getInputStream()) {
            return Base64.getEncoder().encodeToString(in.readAllBytes());
        } catch (IOException e) {
            log.warn("Logo dos e-mails não encontrada ({}): os e-mails vão sem a imagem.", LOGO);
            return null;
        }
    }

    @Override
    public ResultadoEnvio enviar(String email, String template, List<String> variaveis) {
        if (email == null || email.isBlank()) {
            return ResultadoEnvio.definitivo("Responsável sem e-mail cadastrado");
        }
        return enviarTexto(email, templateRegistry.assunto(template), templateRegistry.renderizar(template, variaveis),
                new EmailHtml.Botao("Abrir o portal", urlPortal));
    }

    public ResultadoEnvio enviarTexto(String email, String assunto, String texto, EmailHtml.Botao botao) {
        if (!properties.credenciaisConfiguradas()) {
            return ResultadoEnvio.definitivo("Resend sem API key configurada (RESEND_API_KEY)");
        }
        if (email == null || email.isBlank()) {
            return ResultadoEnvio.definitivo("Destinatário sem e-mail");
        }

        Map<String, Object> corpo = montarCorpo(email, assunto, texto, botao);

        try {
            RespostaEnvio resposta = restClient.post()
                    .uri("/emails")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(corpo)
                    .retrieve()
                    .body(RespostaEnvio.class);

            if (resposta == null || resposta.id() == null) {
                return ResultadoEnvio.definitivo("Resposta do Resend sem id do e-mail");
            }
            return ResultadoEnvio.sucesso(resposta.id());
        } catch (RestClientResponseException e) {
            return classificar(e);
        } catch (ResourceAccessException e) {
            return ResultadoEnvio.temporario("Falha de comunicação com o Resend: " + e.getMessage());
        } catch (RuntimeException e) {
            return ResultadoEnvio.temporario("Erro inesperado ao chamar o Resend: " + e.getMessage());
        }
    }

    Map<String, Object> montarCorpo(String email, String assunto, String texto, EmailHtml.Botao botao) {
        String destino = email;
        if (properties.redirecionamentoAtivo()) {
            destino = properties.redirecionarPara().trim();
        }
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("from", properties.remetente());
        corpo.put("to", List.of(destino));
        corpo.put("subject", assunto);
        corpo.put("text", texto);
        corpo.put("html", EmailHtml.montar(texto, botao, logoBase64 != null));
        if (logoBase64 != null) {
            corpo.put("attachments", List.of(Map.of(
                    "filename", "notus.png",
                    "content", logoBase64,
                    "content_type", "image/png",
                    "content_id", EmailHtml.CID_LOGO)));
        }
        return corpo;
    }

    private ResultadoEnvio classificar(RestClientResponseException e) {
        int httpStatus = e.getStatusCode().value();
        RespostaErro erro = null;
        try {
            erro = e.getResponseBodyAs(RespostaErro.class);
        } catch (RuntimeException ignored) {
        }

        String descricao = "HTTP " + httpStatus
                + (erro == null || erro.name() == null ? "" : " / " + erro.name())
                + (erro == null || erro.message() == null ? "" : " / " + erro.message());

        boolean temporario = httpStatus == 429 || httpStatus >= 500;
        return temporario ? ResultadoEnvio.temporario(descricao) : ResultadoEnvio.definitivo(descricao);
    }
}
