package com.pfc.notus.user.controller;

import com.pfc.notus.user.dto.OnboardingRequest;
import com.pfc.notus.user.dto.WhatsAppOptInDTO;
import com.pfc.notus.user.dto.WhatsAppOptInRequest;
import com.pfc.notus.user.service.ResponsibleService;
import com.pfc.notus.user.service.UserService;
import com.pfc.notus.user.service.util.AuthUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/me")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private ResponsibleService responsibleService;

    @Autowired
    private AuthUtil authUtil;

    @PreAuthorize("hasAnyRole('ROLE_ALUNO','ROLE_RESPONSAVEL','ROLE_PROFESSOR')")
    @PostMapping("/onboarding")
    public ResponseEntity<Void> onBoarding(@Valid @RequestBody OnboardingRequest request) {
        userService.onBoarding(request.newPassword(), request.acceptTerms(), request.whatsappOptIn());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('RESPONSAVEL')")
    @GetMapping("/whatsapp")
    public WhatsAppOptInDTO getWhatsApp() {
        return responsibleService.getOptInWhatsApp(authUtil.getLoggedUser().getId());
    }

    @PreAuthorize("hasRole('RESPONSAVEL')")
    @PutMapping("/whatsapp")
    public WhatsAppOptInDTO alterarWhatsApp(@Valid @RequestBody WhatsAppOptInRequest request) {
        return responsibleService.alterarOptInWhatsApp(authUtil.getLoggedUser().getId(), request.ativo());
    }

    @PreAuthorize("hasAnyRole('ROLE_ADMIN')")
    @PutMapping("/anonymize/{userId}")
    public ResponseEntity<Void> anonimyzeUser(@PathVariable Long userId){
        userService.anonimyzeUser(userId);
        return ResponseEntity.noContent().build();
    }
}
