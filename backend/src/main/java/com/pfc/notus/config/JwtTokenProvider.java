package com.pfc.notus.config;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Date;

@Service
public class JwtTokenProvider {

    private static final int TAMANHO_MINIMO_SEGREDO = 32;

    @Value("${security.jwt.secret}")
    private String secret;

    @Value("${security.jwt.expiration}")
    private long expiration;

    private Algorithm algorithm;

    /**
     * Prepara a assinatura na subida da aplicação. Recusa chave vazia ou curta: com uma chave
     * fraca ou pública, qualquer um conseguiria gerar um token válido (inclusive de admin).
     */
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

    public String getUsername(String token) {
        return JWT.require(algorithm).build().verify(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            JWT.require(algorithm).build().verify(token);
            return true;
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
