package com.pfc.notus.user.controller;

import com.pfc.notus.user.dto.OnboardingRequest;
import com.pfc.notus.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/me")
public class UserController {

    @Autowired
    private UserService userService;

    @PreAuthorize("hasAnyRole('ROLE_ALUNO','ROLE_RESPONSAVEL')")
    @PostMapping("/onboarding")
    public ResponseEntity<Void> onBoarding(@Valid @RequestBody OnboardingRequest request) {
        userService.onBoarding(request.newPassword(), request.acceptTerms());
        return ResponseEntity.noContent().build();
    }
}
