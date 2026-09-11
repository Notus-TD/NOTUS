package com.pfc.notus.user.service;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.user.domain.Role;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.projection.UserDetailsProjection;
import com.pfc.notus.user.repository.RoleRepository;
import com.pfc.notus.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
        for (UserDetailsProjection projection : result) {
            user.addRole(new Role(projection.getRoleId(), projection.getAuthority()));
        }

        return user;
    }

    public User createUser(String name, String email, String phone, String address, String roleAuthority) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ConflictException("E-mail já cadastrado: " + email);
        }

        Role role = roleRepository.findByAuthority(roleAuthority)
                .orElseThrow(() -> new ResourceNotFoundException("Role não encontrada: " + roleAuthority));

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setAddress(address);
        user.setPassword(passwordEncoder.encode(email));
        user.addRole(role);

        return userRepository.save(user);
    }
}
