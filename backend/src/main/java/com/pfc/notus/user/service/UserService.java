package com.pfc.notus.user.service;

import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.notificacao.service.NotificacaoService;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.Role;
import com.pfc.notus.user.domain.Student;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.domain.enums.StatusMatricula;
import com.pfc.notus.user.dto.DependenteDTO;
import com.pfc.notus.user.dto.MeuPerfilDTO;
import com.pfc.notus.user.dto.UsuarioDTO;
import com.pfc.notus.user.projection.UserDetailsProjection;
import com.pfc.notus.user.repository.ResponsibleRepository;
import com.pfc.notus.user.repository.RoleRepository;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.service.util.AuthUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
public class UserService implements UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ResponsibleRepository responsibleRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthUtil authUtil;

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
    public void onBoarding (String newPassword, Boolean acceptTerms){
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

        userRepository.save(user);

    }

    @Transactional(readOnly = true)
    public List<UsuarioDTO> listarUsuarios() {
        return Stream.concat(
                        studentRepository.findAll().stream()
                                .map(s -> new UsuarioDTO(s.getId(), "ALUNO", s.getFullName(), s.getMatricula(), s.getAnonimizadoEm() != null)),
                        responsibleRepository.findAll().stream()
                                .map(r -> new UsuarioDTO(r.getId(), "RESPONSAVEL", r.getName(), null, r.getAnonimizadoEm() != null)))
                .sorted(Comparator.comparing(UsuarioDTO::anonimizado)
                        .thenComparing(UsuarioDTO::nome, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(UsuarioDTO::id))
                .toList();
    }

    @Transactional
    public void anonimyzeUser(Long userId, String confirmacao, String requesterEmail) {
        if (confirmacao == null || confirmacao.isBlank()) {
            throw new RegraNegocioException("Digite a matrícula do aluno ou o registro do responsável para confirmar.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));
        if (user.getAnonimizadoEm() != null) {
            throw new ConflictException("Usuário já foi anonimizado.");
        }
        if (!(user instanceof Student) && !(user instanceof Responsible)) {
            throw new RegraNegocioException("Só alunos e responsáveis podem ser anonimizados.");
        }
        if (user instanceof Student student && !String.valueOf(student.getMatricula()).equals(confirmacao.trim())) {
            throw new RegraNegocioException("A matrícula digitada não confere com a do aluno.");
        }
        if (user instanceof Responsible && !String.valueOf(user.getId()).equals(confirmacao.trim())) {
            throw new RegraNegocioException("O registro digitado não confere com o do responsável.");
        }
        if (user instanceof Responsible && studentRepository.existsByResponsibleIdAndStatusMatricula(user.getId(), StatusMatricula.ATIVA)) {
            throw new ConflictException("Não é possível anonimizar: o responsável tem aluno com matrícula ativa.");
        }

        if (user instanceof Student student) {
            student.setFullName(null);
            student.setBirthDate(null);
            student.setResponsible(null);
            student.setTurma(null);
            student.setStatusMatricula(StatusMatricula.FINALIZADA);
            notificacaoService.cancelarPendentesDoAluno(student.getId(), "Aluno anonimizado");
            notificacaoService.apagarDadosDoAluno(student.getId());
        }
        if (user instanceof Responsible responsible) {
            responsible.setName(null);
            responsible.setPhone(null);
            notificacaoService.cancelarPendentesDoResponsavel(responsible.getId(), "Responsável anonimizado");
            notificacaoService.apagarDadosDoResponsavel(responsible.getId());
        }
        user.setEmail(null);
        user.setPassword(null);
        user.setTermsAcceptedAt(null);
        user.setAtivo(false);
        user.setAnonimizadoEm(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        userRepository.save(user);
        log.info(AuditMarker.AUDIT, "Usuário {} anonimizado por {}", user.getId(), requesterEmail);
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
