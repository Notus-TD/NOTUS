package com.pfc.notus.notificacao.whatsapp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.pfc.notus.notificacao.config.WhatsAppProperties;
import com.pfc.notus.notificacao.port.NotificadorPort;
import com.pfc.notus.notificacao.port.ResultadoEnvio;
import com.pfc.notus.notificacao.util.TelefoneUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
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
import java.util.Set;

@Component
@ConditionalOnProperty(name = "whatsapp.enabled", havingValue = "true")
public class WhatsAppCloudClient implements NotificadorPort {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppCloudClient.class);

    private static final Set<Integer> CODIGOS_TEMPORARIOS = Set.of(1, 2, 4, 80007, 130429, 131016, 131056);

    private final WhatsAppProperties properties;
    private final RestClient restClient;

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RespostaEnvio(List<Mensagem> messages) {
        @JsonIgnoreProperties(ignoreUnknown = true)
        record Mensagem(String id) {
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RespostaErro(Erro error) {
        @JsonIgnoreProperties(ignoreUnknown = true)
        record Erro(String message, Integer code) {
        }
    }

    public WhatsAppCloudClient(WhatsAppProperties properties) {
        this.properties = properties;

        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(15));

        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .requestFactory(requestFactory)
                .defaultHeader("Authorization", "Bearer " + properties.token())
                .build();

        if (!properties.credenciaisConfiguradas()) {
            log.warn("WhatsApp habilitado, mas WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID não configurados. Os envios vão falhar.");
        }
    }

    @Override
    public ResultadoEnvio enviar(String destinoE164, String template, List<String> variaveis) {
        if (!properties.credenciaisConfiguradas()) {
            return ResultadoEnvio.definitivo("WhatsApp sem credenciais configuradas");
        }

        Map<String, Object> corpo = Map.of(
                "messaging_product", "whatsapp",
                "to", TelefoneUtil.paraWhatsApp(destinoE164),
                "type", "template",
                "template", Map.of(
                        "name", template,
                        "language", Map.of("code", properties.idioma()),
                        "components", List.of(Map.of(
                                "type", "body",
                                "parameters", variaveis.stream()
                                        .map(v -> Map.of("type", "text", "text", v))
                                        .toList()
                        ))
                )
        );

        try {
            RespostaEnvio resposta = restClient.post()
                    .uri("/{versao}/{phoneNumberId}/messages", properties.apiVersion(), properties.phoneNumberId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(corpo)
                    .retrieve()
                    .body(RespostaEnvio.class);

            if (resposta == null || resposta.messages() == null || resposta.messages().isEmpty()) {
                return ResultadoEnvio.definitivo("Resposta da Meta sem id de mensagem");
            }
            return ResultadoEnvio.sucesso(resposta.messages().getFirst().id());
        } catch (RestClientResponseException e) {
            return classificar(e);
        } catch (ResourceAccessException e) {
            return ResultadoEnvio.temporario("Falha de comunicação com a Meta: " + e.getMessage());
        }
    }

    private ResultadoEnvio classificar(RestClientResponseException e) {
        int httpStatus = e.getStatusCode().value();
        RespostaErro.Erro erro = null;
        try {
            RespostaErro corpo = e.getResponseBodyAs(RespostaErro.class);
            erro = corpo == null ? null : corpo.error();
        } catch (RuntimeException ignored) {
        }

        Integer codigo = erro == null ? null : erro.code();
        String descricao = "HTTP " + httpStatus
                + (codigo == null ? "" : " / código " + codigo)
                + (erro == null || erro.message() == null ? "" : " / " + erro.message());

        boolean temporario = httpStatus == 429 || httpStatus >= 500
                || (codigo != null && CODIGOS_TEMPORARIOS.contains(codigo));
        return temporario ? ResultadoEnvio.temporario(descricao) : ResultadoEnvio.definitivo(descricao);
    }
}
