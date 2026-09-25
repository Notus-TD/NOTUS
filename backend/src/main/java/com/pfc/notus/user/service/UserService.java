package com.pfc.notus.user.service;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Role;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.dto.DependenteDTO;
import com.pfc.notus.user.dto.MeuPerfilDTO;
import com.pfc.notus.user.projection.UserDetailsProjection;
import com.pfc.notus.user.repository.RoleRepository;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.util.AuthUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthUtil authUtil;

    @Autowired
    private NotificacaoService notificacaoService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        List<UserDetailsProjection> result = userRepository.searchUserAndRolesByEmail(username);
        if (result.isEmpty()) {
            throw new UsernameNotFoundException("Email not found");
        }

        User user = new User(result.getFirst().getUsername(), result.getFirst().getPassword());
        user.setId(result.getFirst().getId());
        user.setFirstLogin(Boolean.TRUE.equals(result.getFirst().getFirstLogin()));
        user.setAtivo(!Boolean.FALSE.equals(result.getFirst().getAtivo()));
        for (UserDetailsProjection projection : result) {
            user.addRole(new Role(projection.getRoleId(), projection.getAuthority()));
        }

        return user;
    }
    @Transactional
    public User register(User user, String roleAuthority) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new ConflictException("E-mail já cadastrado: " + user.getEmail());
        }

        Role role = roleRepository.findByAuthority(roleAuthority)
                .orElseThrow(() -> new ResourceNotFoundException("Role não encontrada: " + roleAuthority));

        user.setId(gerarProximoId());
        user.setEmail(user.getEmail());
        user.setPassword(passwordEncoder.encode(user.getEmail()));
        user.addRole(role);

        return userRepository.save(user);
    }

    @Transactional
    public MeuPerfilDTO getMeuPerfil(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado: " + email));

        List<String> roles = user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();

        String nome = null;
        List<DependenteDTO> dependentes = List.of();

        if (user instanceof Student student) {
            nome = student.getFullName();
        } else if (user instanceof Responsible responsavel) {
            nome = responsavel.getName();
            dependentes = responsavel.getStudents().stream()
                    .map(s -> new DependenteDTO(s.getId(), s.getFullName()))
                    .toList();
        }

        return new MeuPerfilDTO(user.getEmail(), roles, nome, dependentes);
    }


    @Transactional
    public void onBoarding (String newPassword, Boolean acceptTerms, Boolean whatsappOptIn){
        User user = authUtil.getLoggedUser();

        if (user.getAuthorities().equals("ROLE_ADMIN")) {

        }

        if(!user.isFirstLogin()){
            throw new ConflictException("Usuário já fez login no sistema");
        }

        if(!Boolean.TRUE.equals(acceptTerms)){
            throw new ConflictException("Usuário não aceitou os termos de uso");
        }

        user = userRepository.findById(user.getId())
                .orElseThrow();

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setTermsAcceptedAt(LocalDateTime.now());

        user.setFirstLogin(false);

        if (user instanceof Responsible responsible && Boolean.TRUE.equals(whatsappOptIn)) {
            responsible.definirWhatsappOptIn(true);
        }

        userRepository.save(user);

    }

    @Transactional
    public void anonimyzeUser(Long userId){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));

        if (user instanceof Student student) {
            student.setEmail("****");
            student.setBirthDate(null);
            student.setFullName("****");
            student.setAtivo(false);
            student.setStatusMatricula(StatusMatricula.FINALIZADA);
            notificacaoService.cancelarPendentesDoAluno(student.getId(), "Aluno anonimizado");
        } else if (user instanceof Responsible responsible) {
            responsible.setEmail("****");
            responsible.setName("****");
            responsible.setPhone("****");
            responsible.setAtivo(false);
            responsible.definirWhatsappOptIn(false);
            notificacaoService.cancelarPendentesDoResponsavel(responsible.getId(), "Responsável anonimizado");
        }
        userRepository.save(user);
    }

    private Long gerarProximoId() {
        long base = LocalDate.now().getYear() * 1_000_000L;
        Long ultimo = userRepository.buscarUltimoId();

        if (ultimo == null || ultimo < base) {
            return base + 1;
        }
        return ultimo + 1;
    }
}
