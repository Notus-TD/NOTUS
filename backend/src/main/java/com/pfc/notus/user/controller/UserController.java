package com.pfc.notus.user.controller;

import lombok.RequiredArgsConstructor;
import com.pfc.notus.user.dto.OnboardingRequest;
import com.pfc.notus.user.dto.UsuarioDTO;
import com.pfc.notus.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ! REFU: Endpoints gerais de usuário (/users): onboarding, reenviar convite, redefinir MFA e listar
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    // ! REFU: service de usuário
    private final UserService userService;

    // ! REFU: POST /users/me/onboarding - primeiro acesso: define senha e aceita os termos
    @PreAuthorize("hasAnyRole('ROLE_ALUNO','ROLE_RESPONSAVEL','ROLE_PROFESSOR')")
    @PostMapping("/me/onboarding")
    public ResponseEntity<Void> onBoarding(@Valid @RequestBody OnboardingRequest request) {
        userService.onBoarding(request.newPassword(), request.acceptTerms());
        return ResponseEntity.noContent().build();
    }

    // ! REFU: POST /users/{id}/reenviar-convite - admin manda de novo o link de convite para quem ainda não ativou
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{userId}/reenviar-convite")
    public ResponseEntity<Void> reenviarConvite(@PathVariable Long userId, Authentication authentication) {
        userService.reenviarConvite(userId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    // ! REFU: PUT /users/{id}/mfa/redefinir - admin zera o MFA para o usuário cadastrar o app de novo
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{userId}/mfa/redefinir")
    public ResponseEntity<Void> redefinirMfa(@PathVariable Long userId, Authentication authentication) {
        userService.redefinirMfa(userId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    // ! REFU: GET /users - admin lista alunos e responsáveis (anonimizados por último)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listarUsuarios() {
        return ResponseEntity.ok(userService.listarUsuarios());
    }

}
