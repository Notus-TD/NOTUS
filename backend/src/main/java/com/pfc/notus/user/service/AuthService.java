package com.pfc.notus.user.service;

import com.pfc.notus.config.JwtTokenProvider;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.dto.security.AccountCredentialsDTO;
import com.pfc.notus.user.dto.security.TokenDTO;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.util.AuthUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuthService {
    private final AuthenticationManager authManager;
    private final JwtTokenProvider jwtProvider;

    public AuthService(AuthenticationManager authManager, JwtTokenProvider jwtProvider) {
        this.authManager = authManager;
        this.jwtProvider = jwtProvider;
    }

    @Transactional(readOnly = true)
    public TokenDTO login(AccountCredentialsDTO dto) {
        Authentication auth = authManager.authenticate(new UsernamePasswordAuthenticationToken(
                dto.email(),
                dto.password()));

        User user = (User) auth.getPrincipal();
        String token = jwtProvider.createToken(user.getId(), dto.email(), auth.getAuthorities(), user.isFirstLogin());
        Instant expires = Instant.now().plusMillis(jwtProvider.getValidityMs());

        return new TokenDTO(dto.email(), token, expires);
    }
}
