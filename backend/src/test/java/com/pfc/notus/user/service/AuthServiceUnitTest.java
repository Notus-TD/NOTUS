package com.pfc.notus.user.service;

import com.pfc.notus.config.JwtTokenProvider;
import com.pfc.notus.exception.MuitasTentativasException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.user.domain.Professor;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.dto.security.AccountCredentialsDTO;
import com.pfc.notus.user.dto.security.LoginRespostaDTO;
import com.pfc.notus.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceUnitTest {

    private static final String EMAIL = "marta.responsavel@gmail.com";
    private static final String IP = "10.0.0.1";
    private static final String PROFESSOR = "pedro.professor@gmail.com";

    @Mock
    private AuthenticationManager authManager;

    @Mock
    private JwtTokenProvider jwtProvider;

    @Mock
    private LoginTentativaService loginTentativaService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MfaService mfaService;

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

        LoginRespostaDTO resposta = authService.login(new AccountCredentialsDTO(EMAIL, "certa"), IP);

        assertEquals(LoginRespostaDTO.CONCLUIDO, resposta.etapa());
        assertEquals("jwt", resposta.token());
        verify(loginTentativaService).limpar(EMAIL);
    }

    private Professor professor(boolean mfaAtivo) {
        Professor professor = new Professor("Pedro Professor", PROFESSOR);
        professor.setId(2026000002L);
        professor.setMfaAtivo(mfaAtivo);
        professor.setMfaSegredo(mfaAtivo ? "segredo-cifrado" : null);
        return professor;
    }

    @Test
    void professorSemMfaRecebeODesafioDeCadastroESemToken() {
        Professor professor = professor(false);
        when(authManager.authenticate(any())).thenReturn(new UsernamePasswordAuthenticationToken(
                professor, null, List.of(new SimpleGrantedAuthority("ROLE_PROFESSOR"))));
        when(userRepository.findById(2026000002L)).thenReturn(Optional.of(professor));
        when(jwtProvider.createDesafio(2026000002L, PROFESSOR, LoginRespostaDTO.MFA_CADASTRO)).thenReturn("desafio");

        LoginRespostaDTO resposta = authService.login(new AccountCredentialsDTO(PROFESSOR, "certa"), IP);

        assertEquals(LoginRespostaDTO.MFA_CADASTRO, resposta.etapa());
        assertEquals("desafio", resposta.desafio());
        assertNull(resposta.token());
        verify(jwtProvider, never()).createToken(anyLong(), any(), any(), anyBoolean());
    }

    @Test
    void professorComMfaRecebeODesafioDoCodigo() {
        Professor professor = professor(true);
        when(authManager.authenticate(any())).thenReturn(new UsernamePasswordAuthenticationToken(
                professor, null, List.of(new SimpleGrantedAuthority("ROLE_PROFESSOR"))));
        when(userRepository.findById(2026000002L)).thenReturn(Optional.of(professor));
        when(jwtProvider.createDesafio(2026000002L, PROFESSOR, LoginRespostaDTO.MFA)).thenReturn("desafio");

        LoginRespostaDTO resposta = authService.login(new AccountCredentialsDTO(PROFESSOR, "certa"), IP);

        assertEquals(LoginRespostaDTO.MFA, resposta.etapa());
        assertNull(resposta.token());
    }

    @Test
    void codigoCertoLiberaOTokenEGuardaOPassoUsado() {
        Professor professor = professor(true);
        when(jwtProvider.usuarioDoDesafio("desafio", LoginRespostaDTO.MFA)).thenReturn(Optional.of(PROFESSOR));
        when(userRepository.findByEmail(PROFESSOR)).thenReturn(Optional.of(professor));
        when(mfaService.validar("segredo-cifrado", "123456", null)).thenReturn(Optional.of(60_000_000L));
        when(jwtProvider.createToken(anyLong(), any(), any(), anyBoolean())).thenReturn("jwt");

        LoginRespostaDTO resposta = authService.verificarMfa("desafio", "123456", IP);

        assertEquals("jwt", resposta.token());
        assertEquals(60_000_000L, professor.getMfaUltimoPasso());
        verify(loginTentativaService).limpar(PROFESSOR);
    }

    @Test
    void codigoErradoContaComoTentativaFalha() {
        Professor professor = professor(true);
        when(jwtProvider.usuarioDoDesafio("desafio", LoginRespostaDTO.MFA)).thenReturn(Optional.of(PROFESSOR));
        when(userRepository.findByEmail(PROFESSOR)).thenReturn(Optional.of(professor));
        when(mfaService.validar("segredo-cifrado", "000000", null)).thenReturn(Optional.empty());
        when(loginTentativaService.registrarFalha(PROFESSOR, IP)).thenReturn(false);

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> authService.verificarMfa("desafio", "000000", IP));

        assertEquals("Código inválido. Confira o horário do celular e digite o código atual do aplicativo.", excecao.getMessage());
        verify(jwtProvider, never()).createToken(anyLong(), any(), any(), anyBoolean());
    }

    @Test
    void desafioExpiradoPedeNovoLogin() {
        when(jwtProvider.usuarioDoDesafio("velho", LoginRespostaDTO.MFA)).thenReturn(Optional.empty());

        RegraNegocioException excecao = assertThrows(RegraNegocioException.class,
                () -> authService.verificarMfa("velho", "123456", IP));

        assertEquals("A verificação expirou. Entre de novo com e-mail e senha.", excecao.getMessage());
    }

    @Test
    void confirmarCadastroAtivaOMfa() {
        Professor professor = professor(false);
        professor.setMfaSegredo("segredo-cifrado");
        when(jwtProvider.usuarioDoDesafio("desafio", LoginRespostaDTO.MFA_CADASTRO)).thenReturn(Optional.of(PROFESSOR));
        when(userRepository.findByEmail(PROFESSOR)).thenReturn(Optional.of(professor));
        when(mfaService.validar("segredo-cifrado", "123456", null)).thenReturn(Optional.of(60_000_000L));
        when(jwtProvider.createToken(anyLong(), any(), any(), anyBoolean())).thenReturn("jwt");

        LoginRespostaDTO resposta = authService.confirmarCadastroMfa("desafio", "123456", IP);

        assertTrue(professor.isMfaAtivo());
        assertEquals(LoginRespostaDTO.CONCLUIDO, resposta.etapa());
    }
}
