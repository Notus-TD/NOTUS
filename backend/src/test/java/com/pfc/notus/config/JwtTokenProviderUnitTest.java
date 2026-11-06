package com.pfc.notus.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenProviderUnitTest {

    private JwtTokenProvider provider(String segredo) {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "secret", segredo);
        ReflectionTestUtils.setField(provider, "expiration", 3_600_000L);
        return provider;
    }

    @Test
    void recusaChaveCurta() {
        assertThatThrownBy(() -> provider("my-secret").iniciar())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void recusaChaveVazia() {
        assertThatThrownBy(() -> provider("  ").iniciar())
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void tokenAssinadoComOutraChaveNaoEValido() {
        JwtTokenProvider servidor = provider("chave-do-servidor-com-mais-de-32-caracteres");
        servidor.iniciar();
        JwtTokenProvider atacante = provider("chave-de-outra-pessoa-com-mais-de-32-caracteres");
        atacante.iniciar();

        String tokenFalso = atacante.createToken(1L, "admin@notus.com",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")), false);
        String tokenValido = servidor.createToken(1L, "admin@notus.com",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")), false);

        assertThat(servidor.validateToken(tokenFalso)).isFalse();
        assertThat(servidor.validateToken(tokenValido)).isTrue();
        assertThat(servidor.getUsername(tokenValido)).isEqualTo("admin@notus.com");
    }
}
