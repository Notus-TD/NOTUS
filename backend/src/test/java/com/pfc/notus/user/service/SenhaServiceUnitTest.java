package com.pfc.notus.user.service;

import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.TokenSenha;
import com.pfc.notus.user.domain.enums.TipoTokenSenha;
import com.pfc.notus.user.dto.TokenSenhaDTO;
import com.pfc.notus.user.event.LinkSenhaGeradoEvent;
import com.pfc.notus.user.repository.TokenSenhaRepository;
import com.pfc.notus.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SenhaServiceUnitTest {

    private static final String EMAIL = "marta.responsavel@gmail.com";
    private static final String TOKEN = "token-de-teste";

    @Mock
    private UserRepository userRepository;

    @Mock
    private TokenSenhaRepository tokenSenhaRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private LoginTentativaService loginTentativaService;

    @InjectMocks
    private SenhaService senhaService;

    private Responsible user;

    @BeforeEach
    void setUp() {
        user = new Responsible("Marta", EMAIL, "11999999999");
        user.setId(2026000003L);
        user.setPassword("hash-antigo");
        user.setFirstLogin(false);
    }

    @Test
    void solicitarRedefinicaoGeraTokenComHashEPublicaEventoComTokenEmTexto() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(tokenSenhaRepository.countByUserIdAndCriadoEmAfter(eq(user.getId()), any())).thenReturn(0L);

        senhaService.solicitarRedefinicao("  " + EMAIL + " ");

        ArgumentCaptor<TokenSenha> salvo = ArgumentCaptor.forClass(TokenSenha.class);
        verify(tokenSenhaRepository).save(salvo.capture());
        ArgumentCaptor<LinkSenhaGeradoEvent> evento = ArgumentCaptor.forClass(LinkSenhaGeradoEvent.class);
        verify(eventPublisher).publishEvent(evento.capture());

        assertEquals(TipoTokenSenha.REDEFINICAO, salvo.getValue().getTipo());
        assertEquals(EMAIL, evento.getValue().email());
        assertNotEquals(evento.getValue().token(), salvo.getValue().getTokenHash());
        assertEquals(SenhaService.hash(evento.getValue().token()), salvo.getValue().getTokenHash());
        assertEquals(salvo.getValue().getCriadoEm().plusHours(1), salvo.getValue().getExpiraEm());
        verify(tokenSenhaRepository).encerrarAbertos(eq(user.getId()), any());
    }

    @Test
    void solicitarRedefinicaoDeContaNuncaAtivadaEnviaConviteNovo() {
        user.setFirstLogin(true);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(tokenSenhaRepository.countByUserIdAndCriadoEmAfter(eq(user.getId()), any())).thenReturn(0L);

        senhaService.solicitarRedefinicao(EMAIL);

        ArgumentCaptor<TokenSenha> salvo = ArgumentCaptor.forClass(TokenSenha.class);
        verify(tokenSenhaRepository).save(salvo.capture());
        assertEquals(TipoTokenSenha.CONVITE, salvo.getValue().getTipo());
        assertEquals(salvo.getValue().getCriadoEm().plusDays(7), salvo.getValue().getExpiraEm());
    }

    @Test
    void solicitarRedefinicaoComEmailDesconhecidoNaoFazNadaENaoLancaErro() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> senhaService.solicitarRedefinicao(EMAIL));

        verify(tokenSenhaRepository, never()).save(any());
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void solicitarRedefinicaoParaContaInativaNaoGeraLink() {
        user.setAtivo(false);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        senhaService.solicitarRedefinicao(EMAIL);

        verify(tokenSenhaRepository, never()).save(any());
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void solicitarRedefinicaoAcimaDoLimiteIgnoraEmSilencio() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(tokenSenhaRepository.countByUserIdAndCriadoEmAfter(anyLong(), any()))
                .thenReturn((long) SenhaService.MAX_REDEFINICOES_POR_HORA);

        assertDoesNotThrow(() -> senhaService.solicitarRedefinicao(EMAIL));

        verify(tokenSenhaRepository, never()).save(any());
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void definirSenhaComRedefinicaoTrocaSenhaEEncerraLinks() {
        user.setFirstLogin(false);
        when(tokenSenhaRepository.findByTokenHash(SenhaService.hash(TOKEN)))
                .thenReturn(Optional.of(token(TipoTokenSenha.REDEFINICAO, LocalDateTime.now())));
        when(passwordEncoder.encode("novaSenha123")).thenReturn("hash-novo");

        senhaService.definirSenha(TOKEN, "novaSenha123", null);

        assertEquals("hash-novo", user.getPassword());
        assertFalse(user.isFirstLogin());
        verify(tokenSenhaRepository).encerrarAbertos(eq(user.getId()), any());
        verify(userRepository).save(user);
        verify(loginTentativaService).limpar(EMAIL);
    }

    @Test
    void definirSenhaComConviteExigeAceiteDosTermos() {
        when(tokenSenhaRepository.findByTokenHash(SenhaService.hash(TOKEN)))
                .thenReturn(Optional.of(token(TipoTokenSenha.CONVITE, LocalDateTime.now())));

        assertThrows(RegraNegocioException.class, () -> senhaService.definirSenha(TOKEN, "novaSenha123", false));

        assertEquals("hash-antigo", user.getPassword());
        verify(userRepository, never()).save(any());
    }

    @Test
    void definirSenhaComConviteConcluiPrimeiroAcesso() {
        when(tokenSenhaRepository.findByTokenHash(SenhaService.hash(TOKEN)))
                .thenReturn(Optional.of(token(TipoTokenSenha.CONVITE, LocalDateTime.now())));
        when(passwordEncoder.encode("novaSenha123")).thenReturn("hash-novo");

        senhaService.definirSenha(TOKEN, "novaSenha123", true);

        assertEquals("hash-novo", user.getPassword());
        assertFalse(user.isFirstLogin());
        assertNotNull(user.getTermsAcceptedAt());
    }

    @Test
    void definirSenhaComTokenExpiradoFalha() {
        when(tokenSenhaRepository.findByTokenHash(SenhaService.hash(TOKEN)))
                .thenReturn(Optional.of(token(TipoTokenSenha.REDEFINICAO, LocalDateTime.now().minusHours(2))));

        RegraNegocioException e = assertThrows(RegraNegocioException.class,
                () -> senhaService.definirSenha(TOKEN, "novaSenha123", null));
        assertEquals(SenhaService.LINK_INVALIDO, e.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void definirSenhaComTokenJaUsadoFalha() {
        TokenSenha usado = token(TipoTokenSenha.REDEFINICAO, LocalDateTime.now());
        usado.setEncerradoEm(LocalDateTime.now());
        when(tokenSenhaRepository.findByTokenHash(SenhaService.hash(TOKEN))).thenReturn(Optional.of(usado));

        assertThrows(RegraNegocioException.class, () -> senhaService.definirSenha(TOKEN, "novaSenha123", null));
        verify(userRepository, never()).save(any());
    }

    @Test
    void definirSenhaComTokenDesconhecidoFalha() {
        when(tokenSenhaRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThrows(RegraNegocioException.class, () -> senhaService.definirSenha(TOKEN, "novaSenha123", null));
    }

    @Test
    void definirSenhaParaUsuarioAnonimizadoFalha() {
        user.setAnonimizadoEm(LocalDateTime.now());
        when(tokenSenhaRepository.findByTokenHash(SenhaService.hash(TOKEN)))
                .thenReturn(Optional.of(token(TipoTokenSenha.REDEFINICAO, LocalDateTime.now())));

        assertThrows(RegraNegocioException.class, () -> senhaService.definirSenha(TOKEN, "novaSenha123", null));
    }

    @Test
    void validarDevolveTipoEEmailMascarado() {
        when(tokenSenhaRepository.findByTokenHash(SenhaService.hash(TOKEN)))
                .thenReturn(Optional.of(token(TipoTokenSenha.CONVITE, LocalDateTime.now())));

        TokenSenhaDTO dto = senhaService.validar(TOKEN);

        assertEquals(TipoTokenSenha.CONVITE, dto.tipo());
        assertEquals("mar***@gmail.com", dto.emailMascarado());
    }

    private TokenSenha token(TipoTokenSenha tipo, LocalDateTime criadoEm) {
        return new TokenSenha(user, tipo, SenhaService.hash(TOKEN), criadoEm);
    }

}
