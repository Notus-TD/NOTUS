package com.pfc.notus.user.service;

import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.MuitasTentativasException;
import com.pfc.notus.notificacao.util.EmailUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

// ! REFU: Proteção contra força bruta: bloqueia o e-mail após N senhas erradas e limita falhas por IP por minuto (tudo em memória)
@Service
public class LoginTentativaService {

    private static final Logger log = LoggerFactory.getLogger(LoginTentativaService.class);

    // ! REFU: estado por e-mail (falhas, última falha, bloqueado até) e janela de falhas por IP
    private record EstadoEmail(int falhas, Instant ultimaFalha, Instant bloqueadoAte) {
    }

    private record JanelaIp(long minuto, int falhas) {
    }

    // ! REFU: mapas em memória e limites lidos do application.yaml
    private final ConcurrentHashMap<String, EstadoEmail> porEmail = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, JanelaIp> porIp = new ConcurrentHashMap<>();

    private final int maxFalhasPorEmail;
    private final Duration bloqueio;
    private final int maxFalhasPorIpPorMinuto;
    private final Clock clock;

    // ! REFU: construtor usado pelo Spring com os valores de configuração
    @Autowired
    public LoginTentativaService(@Value("${app.login.max-falhas-conta:5}") int maxFalhasPorEmail,
                                 @Value("${app.login.bloqueio-minutos:15}") int bloqueioMinutos,
                                 @Value("${app.login.max-falhas-ip-por-minuto:20}") int maxFalhasPorIpPorMinuto) {
        this(maxFalhasPorEmail, Duration.ofMinutes(bloqueioMinutos), maxFalhasPorIpPorMinuto, Clock.systemUTC());
    }

    // ! REFU: construtor com Clock, usado nos testes
    LoginTentativaService(int maxFalhasPorEmail, Duration bloqueio, int maxFalhasPorIpPorMinuto, Clock clock) {
        this.maxFalhasPorEmail = maxFalhasPorEmail;
        this.bloqueio = bloqueio;
        this.maxFalhasPorIpPorMinuto = maxFalhasPorIpPorMinuto;
        this.clock = clock;
    }

    // ! REFU: antes de tentar logar: lança 429 se o e-mail está bloqueado ou o IP passou do limite no minuto
    public void verificar(String email, String ip) {
        Instant agora = clock.instant();

        EstadoEmail estado = porEmail.get(chave(email));
        if (estado != null && estado.bloqueadoAte() != null && agora.isBefore(estado.bloqueadoAte())) {
            long restanteMs = Duration.between(agora, estado.bloqueadoAte()).toMillis();
            throw new MuitasTentativasException((restanteMs + 999) / 1000);
        }

        JanelaIp janela = porIp.get(ip);
        long minuto = agora.getEpochSecond() / 60;
        if (janela != null && janela.minuto() == minuto && janela.falhas() >= maxFalhasPorIpPorMinuto) {
            throw new MuitasTentativasException(60 - agora.getEpochSecond() % 60);
        }
    }

    // ! REFU: soma uma falha; devolve true se essa falha acabou de bloquear o e-mail
    public boolean registrarFalha(String email, String ip) {
        Instant agora = clock.instant();
        long minuto = agora.getEpochSecond() / 60;

        porIp.merge(ip, new JanelaIp(minuto, 1), (atual, novo) ->
                atual.minuto() == minuto ? new JanelaIp(minuto, atual.falhas() + 1) : novo);

        EstadoEmail estado = porEmail.compute(chave(email), (k, atual) -> {
            int anteriores = atual == null || atual.ultimaFalha().plus(bloqueio).isBefore(agora) ? 0 : atual.falhas();
            int falhas = anteriores + 1;
            if (falhas >= maxFalhasPorEmail) {
                return new EstadoEmail(0, agora, agora.plus(bloqueio));
            }
            return new EstadoEmail(falhas, agora, null);
        });

        if (estado.bloqueadoAte() != null) {
            log.warn(AuditMarker.AUDIT, "Login de {} bloqueado por {} min após {} senhas erradas (IP {})",
                    EmailUtil.mascarar(email), bloqueio.toMinutes(), maxFalhasPorEmail, ip);
            return true;
        }
        return false;
    }

    // ! REFU: duração do bloqueio em segundos (para a mensagem de erro)
    public long segundosDeBloqueio() {
        return bloqueio.toSeconds();
    }

    // ! REFU: login deu certo: zera as falhas do e-mail
    public void limpar(String email) {
        porEmail.remove(chave(email));
    }

    // ! REFU: a cada 5 min limpa da memória os registros que já venceram
    @Scheduled(fixedDelay = 300_000)
    public void descartarVencidos() {
        Instant agora = clock.instant();
        long minuto = agora.getEpochSecond() / 60;
        porEmail.values().removeIf(e -> e.ultimaFalha().plus(bloqueio).isBefore(agora)
                && (e.bloqueadoAte() == null || e.bloqueadoAte().isBefore(agora)));
        porIp.values().removeIf(j -> j.minuto() < minuto);
    }

    // ! REFU: e-mail normalizado (minúsculo, sem espaços) como chave do mapa
    private static String chave(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
