package com.pfc.notus.config;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtTokenProvider {

    private static final int TAMANHO_MINIMO_SEGREDO = 32;
    private static final long VALIDADE_DESAFIO_MS = 5 * 60 * 1000L;

    @Value("${security.jwt.secret}")
    private String secret;

    @Value("${security.jwt.expiration}")
    private long expiration;

    private Algorithm algorithm;

    @PostConstruct
    void iniciar() {
        if (secret == null || secret.isBlank() || secret.length() < TAMANHO_MINIMO_SEGREDO) {
            throw new IllegalStateException("Defina a variável JWT_SECRET com pelo menos "
                    + TAMANHO_MINIMO_SEGREDO + " caracteres aleatórios.");
        }
        algorithm = Algorithm.HMAC256(secret);
    }

    public String createToken(Long id, String username, Collection<? extends GrantedAuthority> roles, boolean fistLogin) {
        Date expiry = new Date(System.currentTimeMillis() + expiration);

        return JWT.create()
                .withSubject(username)
                .withClaim("id", id)
                .withClaim("roles", roles.stream().map(GrantedAuthority::getAuthority).toList())
                .withClaim("firstLogin", fistLogin)
                .withIssuedAt(new Date())
                .withExpiresAt(expiry)
                .sign(algorithm);

    }

    public String createDesafio(Long id, String username, String etapa) {
        return JWT.create()
                .withSubject(username)
                .withClaim("id", id)
                .withClaim("etapa", etapa)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + VALIDADE_DESAFIO_MS))
                .sign(algorithm);
    }

    public Optional<String> usuarioDoDesafio(String token, String etapa) {
        try {
            DecodedJWT decodificado = JWT.require(algorithm).withClaim("etapa", etapa).build().verify(token);
            return Optional.of(decodificado.getSubject());
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public String getUsername(String token) {
        return JWT.require(algorithm).build().verify(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            return JWT.require(algorithm).build().verify(token).getClaim("etapa").isMissing();
        } catch (Exception e) {
            return false;
        }
    }

    public String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    public long getValidityMs() {
        return expiration;
    }
}
