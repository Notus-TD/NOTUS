package com.pfc.notus.user.controller;

import com.pfc.notus.user.dto.AnonimizacaoRequestDTO;
import com.pfc.notus.user.dto.OnboardingRequest;
import com.pfc.notus.user.dto.UsuarioDTO;
import com.pfc.notus.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PreAuthorize("hasAnyRole('ROLE_ALUNO','ROLE_RESPONSAVEL','ROLE_PROFESSOR')")
    @PostMapping("/me/onboarding")
    public ResponseEntity<Void> onBoarding(@Valid @RequestBody OnboardingRequest request) {
        userService.onBoarding(request.newPassword(), request.acceptTerms());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listarUsuarios() {
        return ResponseEntity.ok(userService.listarUsuarios());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/me/anonymize/{userId}")
    public ResponseEntity<Void> anonimyzeUser(@PathVariable Long userId, @RequestBody @Valid AnonimizacaoRequestDTO dto,
                                              Authentication authentication) {
        userService.anonimyzeUser(userId, dto.confirmacao(), authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
