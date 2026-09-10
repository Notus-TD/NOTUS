package com.pfc.notus.config;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Date;

@Service
public class JwtTokenProvider {

    @Value("${security.jwt.secret}")
    private String secret;

    @Value("${security.jwt.expiration}")
    private long expiration;

    private Algorithm algorithm;

    public String createToken(String username, Collection<? extends GrantedAuthority> roles) {
        algorithm = Algorithm.HMAC256(secret);
        Date expiry = new Date(System.currentTimeMillis() + expiration);

        return JWT.create()
                .withSubject(username)
                .withClaim("roles", roles.stream().map(GrantedAuthority::getAuthority).toList())
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
