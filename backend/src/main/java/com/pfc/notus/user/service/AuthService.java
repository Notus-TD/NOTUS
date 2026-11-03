package com.pfc.notus.user.service;

import com.pfc.notus.config.JwtTokenProvider;
import com.pfc.notus.exception.MuitasTentativasException;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.dto.security.AccountCredentialsDTO;
import com.pfc.notus.user.dto.security.TokenDTO;
import org.slf4j.MDC;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuthService {
    private final AuthenticationManager authManager;
    private final JwtTokenProvider jwtProvider;
    private final LoginTentativaService loginTentativaService;

    public AuthService(AuthenticationManager authManager, JwtTokenProvider jwtProvider,
                       LoginTentativaService loginTentativaService) {
        this.authManager = authManager;
        this.jwtProvider = jwtProvider;
        this.loginTentativaService = loginTentativaService;
    }

    @Transactional(readOnly = true)
    public TokenDTO login(AccountCredentialsDTO dto, String ip) {
        MDC.put("user", dto.email());

        loginTentativaService.verificar(dto.email(), ip);

        Authentication auth;
        try {
            auth = authManager.authenticate(new UsernamePasswordAuthenticationToken(
                    dto.email(),
                    dto.password()));
        } catch (BadCredentialsException e) {
            // Senha errada e e-mail inexistente chegam aqui do mesmo jeito.
            if (loginTentativaService.registrarFalha(dto.email(), ip)) {
                throw new MuitasTentativasException(loginTentativaService.segundosDeBloqueio());
            }
            throw e;
        }
        loginTentativaService.limpar(dto.email());

        User user = (User) auth.getPrincipal();
        String token = jwtProvider.createToken(user.getId(), dto.email(), auth.getAuthorities(), user.isFirstLogin());
        Instant expires = Instant.now().plusMillis(jwtProvider.getValidityMs());

        return new TokenDTO(dto.email(), token, expires);
    }
}
