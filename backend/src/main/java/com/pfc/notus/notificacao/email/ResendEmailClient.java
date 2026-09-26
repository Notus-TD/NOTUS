package com.pfc.notus.notificacao.email;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.pfc.notus.notificacao.config.ResendProperties;
import com.pfc.notus.notificacao.port.NotificadorPort;
import com.pfc.notus.notificacao.port.ResultadoEnvio;
import com.pfc.notus.notificacao.service.TemplateRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/** Envia o aviso pela API do Resend (POST /emails) para o e-mail do responsável. */
@Component
public class ResendEmailClient implements NotificadorPort {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailClient.class);

    private final ResendProperties properties;
    private final TemplateRegistry templateRegistry;
    private final RestClient restClient;

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RespostaEnvio(String id) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RespostaErro(String name, String message) {
    }

    public ResendEmailClient(ResendProperties properties, TemplateRegistry templateRegistry) {
        this.properties = properties;
        this.templateRegistry = templateRegistry;

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
    }

    @Override
    public ResultadoEnvio enviar(String email, String template, List<String> variaveis) {
        if (!properties.credenciaisConfiguradas()) {
            return ResultadoEnvio.definitivo("Resend sem API key configurada (RESEND_API_KEY)");
        }
        if (email == null || email.isBlank()) {
            return ResultadoEnvio.definitivo("Responsável sem e-mail cadastrado");
        }

        Map<String, Object> corpo = Map.of(
                "from", properties.remetente(),
                "to", List.of(email),
                "subject", templateRegistry.assunto(template),
                "text", templateRegistry.renderizar(template, variaveis)
        );

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
            // Nunca propaga: qualquer outro erro vira nova tentativa.
            return ResultadoEnvio.temporario("Erro inesperado ao chamar o Resend: " + e.getMessage());
        }
    }

    /** 429 (limite de envio) e 5xx: tenta de novo no próximo ciclo. O resto (401, 403, 422...) é definitivo. */
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
