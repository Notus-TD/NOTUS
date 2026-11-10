package com.pfc.notus.user.controller;

import com.pfc.notus.user.dto.DefinirSenhaRequest;
import com.pfc.notus.user.dto.EsqueciSenhaRequest;
import com.pfc.notus.user.dto.MeuPerfilDTO;
import com.pfc.notus.user.dto.TokenSenhaDTO;
import com.pfc.notus.user.dto.ValidarTokenSenhaRequest;
import com.pfc.notus.user.dto.security.AccountCredentialsDTO;
import com.pfc.notus.user.dto.security.LoginRespostaDTO;
import com.pfc.notus.user.dto.security.MfaCadastroDTO;
import com.pfc.notus.user.dto.security.MfaCodigoRequest;
import com.pfc.notus.user.dto.security.MfaDesafioRequest;
import com.pfc.notus.user.service.AuthService;
import com.pfc.notus.user.service.SenhaService;
import com.pfc.notus.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final SenhaService senhaService;

    public AuthController(AuthService authService, UserService userService, SenhaService senhaService) {
        this.authService = authService;
        this.userService = userService;
        this.senhaService = senhaService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginRespostaDTO> login(@Valid @RequestBody AccountCredentialsDTO dto, HttpServletRequest request) {
        return ResponseEntity.ok(authService.login(dto, request.getRemoteAddr()));
    }

    @PostMapping("/mfa/cadastro")
    public ResponseEntity<MfaCadastroDTO> iniciarCadastroMfa(@Valid @RequestBody MfaDesafioRequest dto) {
        return ResponseEntity.ok(authService.iniciarCadastroMfa(dto.desafio()));
    }

    @PostMapping("/mfa/cadastro/confirmar")
    public ResponseEntity<LoginRespostaDTO> confirmarCadastroMfa(@Valid @RequestBody MfaCodigoRequest dto,
                                                                 HttpServletRequest request) {
        return ResponseEntity.ok(authService.confirmarCadastroMfa(dto.desafio(), dto.codigo(), request.getRemoteAddr()));
    }

    @PostMapping("/mfa/verificar")
    public ResponseEntity<LoginRespostaDTO> verificarMfa(@Valid @RequestBody MfaCodigoRequest dto, HttpServletRequest request) {
        return ResponseEntity.ok(authService.verificarMfa(dto.desafio(), dto.codigo(), request.getRemoteAddr()));
    }

    @PostMapping("/esqueci-senha")
    public ResponseEntity<Void> esqueciSenha(@Valid @RequestBody EsqueciSenhaRequest dto) {
        senhaService.solicitarRedefinicao(dto.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/token-senha/validar")
    public ResponseEntity<TokenSenhaDTO> validarTokenSenha(@Valid @RequestBody ValidarTokenSenhaRequest dto) {
        return ResponseEntity.ok(senhaService.validar(dto.token()));
    }

    @PostMapping("/definir-senha")
    public ResponseEntity<Void> definirSenha(@Valid @RequestBody DefinirSenhaRequest dto) {
        senhaService.definirSenha(dto.token(), dto.novaSenha(), dto.aceiteTermos());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<MeuPerfilDTO> me(Authentication authentication) {
        return ResponseEntity.ok(userService.getMeuPerfil(authentication.getName()));
    }

}
