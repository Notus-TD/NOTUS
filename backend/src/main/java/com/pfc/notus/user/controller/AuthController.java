package com.pfc.notus.user.controller;


import com.pfc.notus.user.dto.MeuPerfilDTO;
import com.pfc.notus.user.dto.security.AccountCredentialsDTO;
import com.pfc.notus.user.dto.security.TokenDTO;
import com.pfc.notus.user.service.AuthService;
import com.pfc.notus.user.service.UserService;
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

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }


    @PostMapping("/login")
    public ResponseEntity<TokenDTO> login(@Valid @RequestBody AccountCredentialsDTO dto) {
        TokenDTO tokenDTO = authService.login(dto);
        return ResponseEntity.ok(tokenDTO);
    }

    @GetMapping("/me")
    public ResponseEntity<MeuPerfilDTO> me(Authentication authentication) {
        return ResponseEntity.ok(userService.getMeuPerfil(authentication.getName()));
    }

}
