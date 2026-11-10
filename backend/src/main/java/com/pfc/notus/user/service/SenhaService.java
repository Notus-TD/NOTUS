package com.pfc.notus.user.service;

import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.notificacao.util.EmailUtil;
import com.pfc.notus.user.domain.TokenSenha;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.domain.enums.TipoTokenSenha;
import com.pfc.notus.user.dto.TokenSenhaDTO;
import com.pfc.notus.user.event.LinkSenhaGeradoEvent;
import com.pfc.notus.user.repository.TokenSenhaRepository;
import com.pfc.notus.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class SenhaService {

    private static final Logger log = LoggerFactory.getLogger(SenhaService.class);

    static final int MAX_REDEFINICOES_POR_HORA = 3;

    static final String LINK_INVALIDO = "Este link é inválido ou já expirou. Peça um novo link.";

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final TokenSenhaRepository tokenSenhaRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final LoginTentativaService loginTentativaService;

    public SenhaService(UserRepository userRepository, TokenSenhaRepository tokenSenhaRepository,
                        PasswordEncoder passwordEncoder, ApplicationEventPublisher eventPublisher,
                        LoginTentativaService loginTentativaService) {
        this.userRepository = userRepository;
        this.tokenSenhaRepository = tokenSenhaRepository;
        this.passwordEncoder = passwordEncoder;
        this.eventPublisher = eventPublisher;
        this.loginTentativaService = loginTentativaService;
    }

    @Transactional
    public void solicitarRedefinicao(String email) {
        Optional<User> encontrado = userRepository.findByEmail(email.trim());
        if (encontrado.isEmpty() || !podeUsarSenha(encontrado.get())) {
            log.info("Pedido de redefinição para e-mail sem conta ativa: {}", EmailUtil.mascarar(email));
            return;
        }
        User user = encontrado.get();

        LocalDateTime agora = LocalDateTime.now();
        long recentes = tokenSenhaRepository.countByUserIdAndCriadoEmAfter(user.getId(), agora.minusHours(1));
        if (recentes >= MAX_REDEFINICOES_POR_HORA) {
            log.warn("Limite de pedidos de redefinição atingido para o usuário {}", user.getId());
            return;
        }

        TipoTokenSenha tipo = user.isFirstLogin() ? TipoTokenSenha.CONVITE : TipoTokenSenha.REDEFINICAO;
        gerarLink(user, tipo, agora);
    }

    @Transactional
    public void gerarLink(User user, TipoTokenSenha tipo) {
        gerarLink(user, tipo, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public TokenSenhaDTO validar(String token) {
        TokenSenha tokenSenha = buscarValido(token, LocalDateTime.now());
        return new TokenSenhaDTO(tokenSenha.getTipo(), EmailUtil.mascarar(tokenSenha.getUser().getEmail()));
    }

    @Transactional
    public void definirSenha(String token, String novaSenha, Boolean aceiteTermos) {
        LocalDateTime agora = LocalDateTime.now();
        TokenSenha tokenSenha = buscarValido(token, agora);
        User user = tokenSenha.getUser();

        if (tokenSenha.getTipo() == TipoTokenSenha.CONVITE) {
            if (!Boolean.TRUE.equals(aceiteTermos)) {
                throw new RegraNegocioException("É preciso aceitar os termos de uso para ativar o acesso.");
            }
            user.setTermsAcceptedAt(agora);
            user.setFirstLogin(false);
        }

        user.setPassword(passwordEncoder.encode(novaSenha));
        tokenSenhaRepository.encerrarAbertos(user.getId(), agora);
        userRepository.save(user);
        loginTentativaService.limpar(user.getEmail());

        log.info(AuditMarker.AUDIT, "Senha do usuário {} definida por link de {}", user.getId(), tokenSenha.getTipo());
    }

    private void gerarLink(User user, TipoTokenSenha tipo, LocalDateTime agora) {
        tokenSenhaRepository.encerrarAbertos(user.getId(), agora);

        String token = novoToken();
        tokenSenhaRepository.save(new TokenSenha(user, tipo, hash(token), agora));
        eventPublisher.publishEvent(new LinkSenhaGeradoEvent(user.getEmail(), tipo, token));

        log.info(AuditMarker.AUDIT, "Link de {} gerado para o usuário {}", tipo, user.getId());
    }

    private TokenSenha buscarValido(String token, LocalDateTime agora) {
        if (token == null || token.isBlank()) {
            throw new RegraNegocioException(LINK_INVALIDO);
        }
        return tokenSenhaRepository.findByTokenHash(hash(token.trim()))
                .filter(t -> t.isValido(agora))
                .filter(t -> podeUsarSenha(t.getUser()))
                .orElseThrow(() -> new RegraNegocioException(LINK_INVALIDO));
    }

    private static boolean podeUsarSenha(User user) {
        return user.isAtivo() && user.getAnonimizadoEm() == null && user.getEmail() != null;
    }

    private static String novoToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }
}
