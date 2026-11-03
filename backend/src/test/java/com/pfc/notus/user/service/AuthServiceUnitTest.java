package com.pfc.notus.user.service;

import com.pfc.notus.config.JwtTokenProvider;
import com.pfc.notus.exception.MuitasTentativasException;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.dto.security.AccountCredentialsDTO;
import com.pfc.notus.user.dto.security.TokenDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceUnitTest {

    private static final String EMAIL = "marta.responsavel@gmail.com";
    private static final String IP = "10.0.0.1";

    @Mock
    private AuthenticationManager authManager;

    @Mock
    private JwtTokenProvider jwtProvider;

    @Mock
    private LoginTentativaService loginTentativaService;

    @InjectMocks
    private AuthService authService;

    @Test
    void senhaErradaRegistraFalhaEDevolveOErroOriginal() {
        when(authManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));
        when(loginTentativaService.registrarFalha(EMAIL, IP)).thenReturn(false);

        assertThrows(BadCredentialsException.class,
                () -> authService.login(new AccountCredentialsDTO(EMAIL, "errada"), IP));
        verify(loginTentativaService, never()).limpar(any());
    }

    @Test
    void falhaQueBloqueiaDevolve429() {
        when(authManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));
        when(loginTentativaService.registrarFalha(EMAIL, IP)).thenReturn(true);
        when(loginTentativaService.segundosDeBloqueio()).thenReturn(900L);

        MuitasTentativasException e = assertThrows(MuitasTentativasException.class,
                () -> authService.login(new AccountCredentialsDTO(EMAIL, "errada"), IP));
        assertEquals(900L, e.getSegundosParaLiberar());
    }

    @Test
    void contaBloqueadaNemConfereASenha() {
        doThrow(new MuitasTentativasException(600)).when(loginTentativaService).verificar(EMAIL, IP);

        assertThrows(MuitasTentativasException.class,
                () -> authService.login(new AccountCredentialsDTO(EMAIL, "certa"), IP));
        verifyNoInteractions(authManager);
    }

    @Test
    void loginCertoLimpaAsFalhas() {
        Responsible user = new Responsible("Marta", EMAIL, "11999999999");
        user.setId(2026000003L);
        when(authManager.authenticate(any()))
                .thenReturn(new UsernamePasswordAuthenticationToken(user, null, List.of()));
        when(jwtProvider.createToken(anyLong(), any(), any(), anyBoolean())).thenReturn("jwt");

        TokenDTO token = authService.login(new AccountCredentialsDTO(EMAIL, "certa"), IP);

        assertEquals("jwt", token.token());
        verify(loginTentativaService).limpar(EMAIL);
    }
}
