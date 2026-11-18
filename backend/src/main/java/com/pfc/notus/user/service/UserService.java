package com.pfc.notus.user.service;

import lombok.RequiredArgsConstructor;
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
import com.pfc.notus.user.domain.enums.TipoTokenSenha;
import com.pfc.notus.user.dto.DependenteDTO;
import com.pfc.notus.user.dto.MeuPerfilDTO;
import com.pfc.notus.user.dto.UsuarioDTO;
import com.pfc.notus.user.projection.UserDetailsProjection;
import com.pfc.notus.user.repository.ResponsibleRepository;
import com.pfc.notus.user.repository.RoleRepository;
import com.pfc.notus.user.repository.StudentRepository;
import com.pfc.notus.user.repository.UserRepository;
import com.pfc.notus.user.validator.PasswordValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Objects;
import java.util.UUID;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

// ! REFU: Base de todos os usuários: carrega para o Spring Security, cadastra, troca e-mail, convite, MFA, perfil e anonimização LGPD
@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    // ! REFU: log de auditoria
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    // ! REFU: repositórios de usuário, aluno, responsável, role + notificação, encoder de senha e service de senha
    private final UserRepository userRepository;

    private final StudentRepository studentRepository;

    private final ResponsibleRepository responsibleRepository;

    private final NotificacaoService notificacaoService;

    private final RoleRepository roleRepository;

    private final PasswordEncoder passwordEncoder;

    private final SenhaService senhaService;

    // ! REFU: usado pelo Spring no login: monta o User com papéis; aluno sem acesso liberado fica inativo
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        List<UserDetailsProjection> result = userRepository.searchUserAndRolesByEmail(username);
        if (result.isEmpty()) {
            throw new UsernameNotFoundException("Email not found");
        }

        User user = new User(result.getFirst().getUsername(), result.getFirst().getPassword());
        user.setId(result.getFirst().getId());
        user.setFirstLogin(Boolean.TRUE.equals(result.getFirst().getFirstLogin()));
        user.setAtivo(!Boolean.FALSE.equals(result.getFirst().getAtivo())
                && !Boolean.FALSE.equals(result.getFirst().getAcessoLiberado()));
        for (UserDetailsProjection projection : result) {
            user.addRole(new Role(projection.getRoleId(), projection.getAuthority()));
        }

        return user;
    }
    // ! REFU: cadastra e já manda o link de convite por e-mail
    @Transactional
    public User register(User user, String roleAuthority) {
        User salvo = registrarSemConvite(user, roleAuthority);
        senhaService.gerarLink(salvo, TipoTokenSenha.CONVITE);
        return salvo;
    }

    // ! REFU: cadastra sem e-mail: valida e-mail único, gera id (ano + sequência), senha aleatória e o papel
    @Transactional
    public User registrarSemConvite(User user, String roleAuthority) {
        if (user.getEmail() != null && userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new ConflictException("E-mail já cadastrado: " + user.getEmail());
        }

        Role role = roleRepository.findByAuthority(roleAuthority)
                .orElseThrow(() -> new ResourceNotFoundException("Role não encontrada: " + roleAuthority));

        user.setId(gerarProximoId());
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.addRole(role);

        return userRepository.save(user);
    }

    // ! REFU: normaliza e troca o e-mail, recusando se outro usuário já usa
    public void atualizarEmail(User user, String novoEmail) {
        String emailLimpo = User.normalizarEmail(novoEmail);
        userRepository.findByEmail(emailLimpo).ifPresent(outro -> {
            if (!outro.getId().equals(user.getId())) {
                throw new ConflictException("E-mail já cadastrado: " + emailLimpo);
            }
        });
        user.setEmail(emailLimpo);
    }

    // ! REFU: admin reenvia o convite: só para conta ativa que nunca logou (aluno precisa ter acesso liberado)
    @Transactional
    public void reenviarConvite(Long userId, String requesterEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));
        if (user.getAnonimizadoEm() != null || !user.isAtivo() || user.getEmail() == null) {
            throw new RegraNegocioException("Este usuário não está ativo.");
        }
        if (!user.isFirstLogin()) {
            throw new ConflictException("Este usuário já ativou o acesso. Ele pode usar \"Esqueci minha senha\" no login.");
        }
        if (user instanceof Student aluno && aluno.getAcessoLiberadoEm() == null) {
            throw new RegraNegocioException("O acesso deste aluno ainda não foi liberado pelo responsável.");
        }
        senhaService.gerarLink(user, TipoTokenSenha.CONVITE);
        log.info(AuditMarker.AUDIT, "Convite do usuário {} reenviado por {}", user.getId(), requesterEmail);
    }

    // ! REFU: admin zera o MFA do usuário (perdeu o celular); no próximo login cadastra de novo
    @Transactional
    public void redefinirMfa(Long userId, String requesterEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));
        if (!user.isMfaAtivo() && user.getMfaSegredo() == null) {
            throw new ConflictException("Este usuário ainda não ativou a verificação em duas etapas.");
        }

        user.limparMfa();
        userRepository.save(user);
        log.info(AuditMarker.AUDIT, "Verificação em duas etapas do usuário {} redefinida por {}", user.getId(), requesterEmail);
    }

    // ! REFU: e-mail, papéis, nome e (se responsável) a lista de filhos
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

    // ! REFU: primeiro acesso: define senha e aceita os termos; só funciona uma vez
    @Transactional
    public void onBoarding (String newPassword, Boolean acceptTerms){
        User user = usuarioLogado();

        if(!user.isFirstLogin()){
            throw new ConflictException("Usuário já fez login no sistema");
        }

        if(!Boolean.TRUE.equals(acceptTerms)){
            throw new ConflictException("Usuário não aceitou os termos de uso");
        }

        // REFN: valida se a senha atende critérios de força
        PasswordValidator.validarSenhaForte(newPassword);

        user = userRepository.findById(user.getId())
                .orElseThrow();

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setTermsAcceptedAt(LocalDateTime.now());

        user.setFirstLogin(false);

        userRepository.save(user);

    }

    // ! REFU: alunos e responsáveis juntos, anonimizados por último e depois por nome
    @Transactional(readOnly = true)
    public List<UsuarioDTO> listarUsuarios() {
        return Stream.concat(
                        studentRepository.findAll().stream()
                                .map(s -> new UsuarioDTO(s.getId(), "ALUNO", s.getFullName(), s.getMatricula(), s.getAnonimizadoEm() != null, s.isFirstLogin(), s.getStatusMatricula())),
                        responsibleRepository.findAll().stream()
                                .map(r -> new UsuarioDTO(r.getId(), "RESPONSAVEL", r.getName(), null, r.getAnonimizadoEm() != null, r.isFirstLogin(), null)))
                .sorted(Comparator.comparing(UsuarioDTO::anonimizado)
                        .thenComparing(UsuarioDTO::nome, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(UsuarioDTO::id))
                .toList();
    }

    /** LGPD: apaga os dados pessoais de um aluno ou responsável. Cada entidade sabe o que apagar (anonimizar()). */
    // ! REFU: LGPD: confirma com matrícula (aluno) ou id (responsável), valida bloqueios, anonimiza e limpa os avisos
    @Transactional
    public void anonymizeUser(Long userId, String confirmacao, String requesterEmail) {
        if (confirmacao == null || confirmacao.isBlank()) {
            throw new RegraNegocioException("Digite a matrícula do aluno ou o registro do responsável para confirmar.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));
        if (user.getAnonimizadoEm() != null) {
            throw new ConflictException("Usuário já foi anonimizado.");
        }

        switch (user) {
            case Student aluno -> validarAnonimizacaoDoAluno(aluno, confirmacao.trim());
            case Responsible responsavel -> validarAnonimizacaoDoResponsavel(responsavel, confirmacao.trim());
            default -> throw new RegraNegocioException("Só alunos e responsáveis podem ser anonimizados.");
        }

        user.anonimizar();
        apagarDadosDasNotificacoes(user);
        userRepository.save(user);
        log.info(AuditMarker.AUDIT, "Usuário {} anonimizado por {}", user.getId(), requesterEmail);
    }

    // ! REFU: matrícula digitada precisa bater e a matrícula não pode estar ativa
    private void validarAnonimizacaoDoAluno(Student aluno, String confirmacao) {
        if (!String.valueOf(aluno.getMatricula()).equals(confirmacao)) {
            throw new RegraNegocioException("A matrícula digitada não confere com a do aluno.");
        }
        if (aluno.getStatusMatricula() == StatusMatricula.ATIVA) {
            throw new ConflictException("Cancele a matrícula do aluno antes de anonimizar.");
        }
    }

    // ! REFU: id digitado precisa bater e nenhum filho pode ter matrícula ativa
    private void validarAnonimizacaoDoResponsavel(Responsible responsavel, String confirmacao) {
        if (!String.valueOf(responsavel.getId()).equals(confirmacao)) {
            throw new RegraNegocioException("O registro digitado não confere com o do responsável.");
        }
        if (studentRepository.existsByResponsibleIdAndStatusMatricula(responsavel.getId(), StatusMatricula.ATIVA)) {
            throw new ConflictException("Não é possível anonimizar: o responsável tem aluno com matrícula ativa.");
        }
    }

    // ! REFU: cancela avisos pendentes e apaga os dados pessoais dos avisos já enviados
    private void apagarDadosDasNotificacoes(User user) {
        if (user instanceof Student) {
            notificacaoService.cancelarPendentesDoAluno(user.getId(), "Aluno anonimizado");
            notificacaoService.apagarDadosDoAluno(user.getId());
        } else {
            notificacaoService.cancelarPendentesDoResponsavel(user.getId(), "Responsável anonimizado");
            notificacaoService.apagarDadosDoResponsavel(user.getId());
        }
    }

    // ! REFU: id = ano atual * 1.000.000 + sequência (ex: 2026000001)
    private Long gerarProximoId() {
        long base = LocalDate.now().getYear() * 1_000_000L;
        Long ultimo = userRepository.buscarUltimoId();

        if (ultimo == null || ultimo < base) {
            return base + 1;
        }
        return ultimo + 1;
    }

    // ! REFU: pega o usuário do contexto de segurança
    private static User usuarioLogado() {
        return (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
    }
}
