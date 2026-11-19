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

// ! REFU: Links de senha por e-mail: convite (7 dias) e redefinição (1 hora); o token é guardado só como hash
@Service
public class SenhaService {

    // ! REFU: limite de 3 pedidos por hora e mensagem padrão de link inválido
    private static final Logger log = LoggerFactory.getLogger(SenhaService.class);

    static final int MAX_REDEFINICOES_POR_HORA = 3;

    static final String LINK_INVALIDO = "Este link é inválido ou já expirou. Peça um novo link.";

    private static final SecureRandom RANDOM = new SecureRandom();

    // ! REFU: repositórios de usuário e token, encoder de senha, eventos (para o e-mail) e controle de tentativas
    private final UserRepository userRepository;
    private final TokenSenhaRepository tokenSenhaRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final LoginTentativaService loginTentativaService;

    // ! REFU: injeção via construtor
    public SenhaService(UserRepository userRepository, TokenSenhaRepository tokenSenhaRepository,
                        PasswordEncoder passwordEncoder, ApplicationEventPublisher eventPublisher,
                        LoginTentativaService loginTentativaService) {
        this.userRepository = userRepository;
        this.tokenSenhaRepository = tokenSenhaRepository;
        this.passwordEncoder = passwordEncoder;
        this.eventPublisher = eventPublisher;
        this.loginTentativaService = loginTentativaService;
    }

    // ! REFU: esqueci senha: se a conta existe e está ativa gera o link (convite se nunca ativou, senão redefinição); respeita o limite por hora
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

    // ! REFU: gera um link novo para o usuário (usado no cadastro e no reenvio de convite)
    @Transactional
    public void gerarLink(User user, TipoTokenSenha tipo) {
        gerarLink(user, tipo, LocalDateTime.now());
    }

    // ! REFU: confere se o token existe, não expirou e não foi usado; devolve o tipo e o e-mail mascarado
    @Transactional(readOnly = true)
    public TokenSenhaDTO validar(String token) {
        TokenSenha tokenSenha = buscarValido(token, LocalDateTime.now());
        return new TokenSenhaDTO(tokenSenha.getTipo(), EmailUtil.mascarar(tokenSenha.getUser().getEmail()));
    }

    // ! REFU: troca a senha pelo link; convite exige aceitar os termos e marca o primeiro acesso como feito; encerra os outros links
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

    // ! REFU: encerra links abertos, salva o hash do token novo e dispara o evento que manda o e-mail
    private void gerarLink(User user, TipoTokenSenha tipo, LocalDateTime agora) {
        tokenSenhaRepository.encerrarAbertos(user.getId(), agora);

        String token = novoToken();
        tokenSenhaRepository.save(new TokenSenha(user, tipo, hash(token), agora));
        eventPublisher.publishEvent(new LinkSenhaGeradoEvent(user.getEmail(), tipo, token));

        log.info(AuditMarker.AUDIT, "Link de {} gerado para o usuário {}", tipo, user.getId());
    }

    // ! REFU: busca pelo hash e valida expiração, uso e se a conta pode usar senha
    private TokenSenha buscarValido(String token, LocalDateTime agora) {
        if (token == null || token.isBlank()) {
            throw new RegraNegocioException(LINK_INVALIDO);
        }
        return tokenSenhaRepository.findByTokenHash(hash(token.trim()))
                .filter(t -> t.isValido(agora))
                .filter(t -> podeUsarSenha(t.getUser()))
                .orElseThrow(() -> new RegraNegocioException(LINK_INVALIDO));
    }

    // ! REFU: conta ativa, não anonimizada e com e-mail
    private static boolean podeUsarSenha(User user) {
        return user.isAtivo() && user.getAnonimizadoEm() == null && user.getEmail() != null;
    }

    // ! REFU: 32 bytes aleatórios em base64 URL-safe
    private static String novoToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    // ! REFU: SHA-256 em hex (o que vai pro banco)
    static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }
}
