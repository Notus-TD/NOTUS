package com.pfc.notus.user.service;

import com.pfc.notus.exception.MuitasTentativasException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

class LoginTentativaServiceUnitTest {

    private static final String EMAIL = "marta.responsavel@gmail.com";
    private static final String IP = "10.0.0.1";

    /** Relógio que o teste avança na mão. */
    private static final class RelogioManual extends Clock {
        private Instant agora = Instant.parse("2026-11-03T12:00:00Z");

        void avancar(Duration d) {
            agora = agora.plus(d);
        }

        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return agora; }
    }

    private RelogioManual relogio;
    private LoginTentativaService service;

    @BeforeEach
    void setUp() {
        relogio = new RelogioManual();
        service = new LoginTentativaService(5, Duration.ofMinutes(15), 20, relogio);
    }

    private void errar(int vezes, String email, String ip) {
        for (int i = 0; i < vezes; i++) service.registrarFalha(email, ip);
    }

    @Test
    void quintaSenhaErradaBloqueiaOEmailPor15Minutos() {
        errar(4, EMAIL, IP);
        assertDoesNotThrow(() -> service.verificar(EMAIL, IP));

        assertTrue(service.registrarFalha(EMAIL, IP));

        MuitasTentativasException e = assertThrows(MuitasTentativasException.class, () -> service.verificar(EMAIL, IP));
        assertTrue(e.getMessage().contains("15 minutos"), e.getMessage());

        relogio.avancar(Duration.ofMinutes(15).plusSeconds(1));
        assertDoesNotThrow(() -> service.verificar(EMAIL, IP));
    }

    @Test
    void bloqueioNaoDependeDeMaiusculasNemEspacos() {
        errar(5, " Marta.Responsavel@GMAIL.com ", IP);

        assertThrows(MuitasTentativasException.class, () -> service.verificar(EMAIL, "10.0.0.2"));
    }

    @Test
    void loginCertoZeraAsFalhas() {
        errar(4, EMAIL, IP);
        service.limpar(EMAIL);

        assertFalse(service.registrarFalha(EMAIL, IP));
        assertDoesNotThrow(() -> service.verificar(EMAIL, IP));
    }

    @Test
    void falhasAntigasNaoSeSomamAsNovas() {
        errar(4, EMAIL, IP);
        relogio.avancar(Duration.ofMinutes(16));

        assertFalse(service.registrarFalha(EMAIL, IP));
        assertDoesNotThrow(() -> service.verificar(EMAIL, IP));
    }

    @Test
    void emailInexistenteEBloqueadoDoMesmoJeito() {
        errar(5, "nao.existe@gmail.com", IP);

        assertThrows(MuitasTentativasException.class, () -> service.verificar("nao.existe@gmail.com", IP));
    }

    @Test
    void ipComMuitasFalhasNoMesmoMinutoEBloqueadoParaQualquerEmail() {
        for (int i = 0; i < 20; i++) service.registrarFalha("conta" + i + "@gmail.com", IP);

        assertThrows(MuitasTentativasException.class, () -> service.verificar(EMAIL, IP));
        assertDoesNotThrow(() -> service.verificar(EMAIL, "10.0.0.2"));

        relogio.avancar(Duration.ofMinutes(1));
        assertDoesNotThrow(() -> service.verificar(EMAIL, IP));
    }

    @Test
    void descartarVencidosRemoveBloqueiosExpirados() {
        errar(5, EMAIL, IP);
        relogio.avancar(Duration.ofMinutes(20));

        service.descartarVencidos();

        assertFalse(service.registrarFalha(EMAIL, IP));
    }
}
