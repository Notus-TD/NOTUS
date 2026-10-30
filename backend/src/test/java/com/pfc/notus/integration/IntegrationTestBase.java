package com.pfc.notus.integration;

import com.pfc.notus.user.domain.Professor;
import com.pfc.notus.user.domain.Role;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.dto.security.AccountCredentialsDTO;
import com.pfc.notus.user.dto.security.TokenDTO;
import com.pfc.notus.user.repository.RoleRepository;
import com.pfc.notus.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.client.RestClient;

import java.util.List;

/**
 * Sobe a aplicacao inteira em porta aleatoria, com banco H2 descartavel, e chama a API por HTTP real.
 * Nao existe cadastro publico de usuario, entao o usuario nasce pelo repositorio, com e-mail e id
 * unicos por execucao; o token vem sempre do endpoint real de login.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
abstract class IntegrationTestBase {

    private static final String SENHA = "senha-de-teste";

    @LocalServerPort
    private int port;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    protected RestClient client;

    protected record ProfessorLogado(Long id, String token) {
    }

    protected record ErroPadrao(Integer status, String message, String path) {
    }

    protected record ErroValidacao(Integer status, String message, String path, List<CampoInvalido> errors) {
    }

    protected record CampoInvalido(String fieldName, String message) {
    }

    @BeforeEach
    void configurarCliente() {
        client = RestClient.builder()
                .baseUrl("http://localhost:" + port)
                .defaultStatusHandler(status -> true, (req, res) -> {})
                .build();
    }

    protected String criarAdminELogar() {
        long ts = System.nanoTime();
        User admin = new User("admin." + ts + "@teste.com", passwordEncoder.encode(SENHA));
        return salvarELogar(admin, ts, "ROLE_ADMIN");
    }

    protected String criarProfessorELogar() {
        return criarProfessorLogado().token();
    }

    protected ProfessorLogado criarProfessorLogado() {
        long ts = System.nanoTime();
        Professor professor = new Professor("Professor " + ts, "professor." + ts + "@teste.com");
        professor.setPassword(passwordEncoder.encode(SENHA));
        return new ProfessorLogado(ts, salvarELogar(professor, ts, "ROLE_PROFESSOR"));
    }

    protected String logar(String email) {
        TokenDTO token = client.post().uri("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new AccountCredentialsDTO(email, SENHA))
                .retrieve()
                .body(TokenDTO.class);
        return token.token();
    }

    private String salvarELogar(User user, long id, String authority) {
        user.setId(id);
        user.setFirstLogin(false);
        user.addRole(buscarOuCriarRole(authority));
        userRepository.save(user);
        return logar(user.getEmail());
    }

    protected Role buscarOuCriarRole(String authority) {
        return roleRepository.findByAuthority(authority)
                .orElseGet(() -> roleRepository.save(new Role(null, authority)));
    }
}
