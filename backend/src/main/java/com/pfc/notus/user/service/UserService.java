package com.pfc.notus.user.service;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Role;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.dto.DependenteDTO;
import com.pfc.notus.user.dto.MeuPerfilDTO;
import com.pfc.notus.user.projection.UserDetailsProjection;
import com.pfc.notus.user.repository.RoleRepository;
import com.pfc.notus.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        List<UserDetailsProjection> result = userRepository.searchUserAndRolesByEmail(username);
        if (result.isEmpty()) {
            throw new UsernameNotFoundException("Email not found");
        }

        User user = new User(result.getFirst().getUsername(), result.getFirst().getPassword());
        user.setId(result.getFirst().getId());
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

    private Long gerarProximoId() {
        long base = LocalDate.now().getYear() * 1_000_000L;
        Long ultimo = userRepository.buscarUltimoId();

        if (ultimo == null || ultimo < base) {
            return base + 1;
        }
        return ultimo + 1;
    }
}
