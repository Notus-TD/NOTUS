package com.pfc.notus.user.service;

import com.pfc.notus.config.JwtTokenProvider;
import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.MuitasTentativasException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.dto.security.AccountCredentialsDTO;
import com.pfc.notus.user.dto.security.LoginRespostaDTO;
import com.pfc.notus.user.dto.security.MfaCadastroDTO;
import com.pfc.notus.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.Set;

// ! REFU: Fluxo de login: senha, controle de tentativas, MFA obrigatório para admin/professor e geração do JWT
@Service
public class AuthService {

    // ! REFU: papéis que precisam de MFA (admin e professor)
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final Set<String> PERFIS_COM_MFA = Set.of("ROLE_ADMIN", "ROLE_PROFESSOR");

    // ! REFU: autenticação do Spring, gerador de JWT, controle de tentativas, repositório de usuário e TOTP
    private final AuthenticationManager authManager;
    private final JwtTokenProvider jwtProvider;
    private final LoginTentativaService loginTentativaService;
    private final UserRepository userRepository;
    private final MfaService mfaService;

    // ! REFU: injeção via construtor
    public AuthService(AuthenticationManager authManager, JwtTokenProvider jwtProvider,
                       LoginTentativaService loginTentativaService, UserRepository userRepository,
                       MfaService mfaService) {
        this.authManager = authManager;
        this.jwtProvider = jwtProvider;
        this.loginTentativaService = loginTentativaService;
        this.userRepository = userRepository;
        this.mfaService = mfaService;
    }

    // ! REFU: confere e-mail/senha; conta falhas por e-mail e IP; sem MFA devolve token, com MFA devolve desafio (cadastro ou verificação)
    @Transactional(readOnly = true)
    public LoginRespostaDTO login(AccountCredentialsDTO dto, String ip) {
        MDC.put("user", dto.email());

        loginTentativaService.verificar(dto.email(), ip);

        Authentication auth;
        try {
            auth = authManager.authenticate(new UsernamePasswordAuthenticationToken(
                    dto.email(),
                    dto.password()));
        } catch (BadCredentialsException e) {
            if (loginTentativaService.registrarFalha(dto.email(), ip)) {
                throw new MuitasTentativasException(loginTentativaService.segundosDeBloqueio());
            }
            throw e;
        }
        loginTentativaService.limpar(dto.email());

        User user = (User) auth.getPrincipal();
        boolean exigeMfa = auth.getAuthorities().stream().anyMatch(a -> PERFIS_COM_MFA.contains(a.getAuthority()));
        if (!exigeMfa) {
            return concluir(user.getId(), user.getEmail(), auth.getAuthorities(), user.isFirstLogin());
        }

        User completo = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + user.getId()));
        String etapa = completo.isMfaAtivo() ? LoginRespostaDTO.MFA : LoginRespostaDTO.MFA_CADASTRO;
        return LoginRespostaDTO.desafio(etapa, user.getEmail(), jwtProvider.createDesafio(user.getId(), user.getEmail(), etapa));
    }

    // ! REFU: primeiro login com MFA: gera o segredo cifrado e devolve a URI do QR code e o segredo em base32
    @Transactional
    public MfaCadastroDTO iniciarCadastroMfa(String desafio) {
        User user = usuarioDoDesafio(desafio, LoginRespostaDTO.MFA_CADASTRO);
        if (user.isMfaAtivo()) {
            throw new ConflictException("A verificação em duas etapas já está ativa. Entre de novo.");
        }

        user.setMfaSegredo(mfaService.novoSegredoCifrado());
        userRepository.save(user);
        return new MfaCadastroDTO(mfaService.uriCadastro(user.getMfaSegredo(), user.getEmail()),
                mfaService.segredoBase32(user.getMfaSegredo()));
    }

    // ! REFU: valida o primeiro código do app, marca o MFA como ativo e conclui o login
    @Transactional
    public LoginRespostaDTO confirmarCadastroMfa(String desafio, String codigo, String ip) {
        User user = usuarioDoDesafio(desafio, LoginRespostaDTO.MFA_CADASTRO);
        if (user.isMfaAtivo()) {
            throw new ConflictException("A verificação em duas etapas já está ativa. Entre de novo.");
        }
        if (user.getMfaSegredo() == null) {
            throw new RegraNegocioException("Leia o QR code no aplicativo antes de confirmar.");
        }

        long passo = conferirCodigo(user, codigo, ip);
        user.setMfaAtivo(true);
        user.setMfaUltimoPasso(passo);
        userRepository.save(user);
        log.info(AuditMarker.AUDIT, "Verificação em duas etapas ativada | usuário {}", user.getId());
        return concluir(user.getId(), user.getEmail(), user.getAuthorities(), user.isFirstLogin());
    }

    // ! REFU: segunda etapa do login normal: valida o código e conclui
    @Transactional
    public LoginRespostaDTO verificarMfa(String desafio, String codigo, String ip) {
        User user = usuarioDoDesafio(desafio, LoginRespostaDTO.MFA);
        if (!user.isMfaAtivo()) {
            throw new RegraNegocioException("A verificação em duas etapas não está ativa. Entre de novo.");
        }

        user.setMfaUltimoPasso(conferirCodigo(user, codigo, ip));
        userRepository.save(user);
        return concluir(user.getId(), user.getEmail(), user.getAuthorities(), user.isFirstLogin());
    }

    // ! REFU: lê o JWT de desafio e busca o usuário; se expirou manda entrar de novo
    private User usuarioDoDesafio(String desafio, String etapa) {
        String email = jwtProvider.usuarioDoDesafio(desafio, etapa)
                .orElseThrow(() -> new RegraNegocioException("A verificação expirou. Entre de novo com e-mail e senha."));
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RegraNegocioException("A verificação expirou. Entre de novo com e-mail e senha."));
    }

    // ! REFU: valida o código TOTP com proteção contra força bruta (mesmas regras do login)
    private long conferirCodigo(User user, String codigo, String ip) {
        loginTentativaService.verificar(user.getEmail(), ip);
        Optional<Long> passo = mfaService.validar(user.getMfaSegredo(), codigo, user.getMfaUltimoPasso());
        if (passo.isEmpty()) {
            if (loginTentativaService.registrarFalha(user.getEmail(), ip)) {
                throw new MuitasTentativasException(loginTentativaService.segundosDeBloqueio());
            }
            throw new RegraNegocioException("Código inválido. Confira o horário do celular e digite o código atual do aplicativo.");
        }
        loginTentativaService.limpar(user.getEmail());
        return passo.get();
    }

    // ! REFU: gera o JWT final com os papéis e a flag de primeiro acesso
    private LoginRespostaDTO concluir(Long id, String email, Collection<? extends GrantedAuthority> perfis, boolean primeiroAcesso) {
        String token = jwtProvider.createToken(id, email, perfis, primeiroAcesso);
        return LoginRespostaDTO.concluido(email, token, Instant.now().plusMillis(jwtProvider.getValidityMs()));
    }
}
