# Bug: `firstLogin` sempre `true`, mesmo pra quem já tem senha definida

## Sintoma

Usuários com `first_login = FALSE` no banco (ex.: `juliana.responsavel@gmail.com`, seed em
`import.sql`) continuavam sendo tratados como se fosse o primeiro acesso: o front redirecionava
pra `/onboarding` e o backend bloqueava qualquer rota fora de `/auth/login`, `/auth/me` e
`/users/me/onboarding` (regra `!principal.firstLogin` em `AppConfig`).

Não era um caso isolado — afetava **todo usuário autenticado**, não só o relatado.

## Causa raiz

`UserService.loadUserByUsername` é o único método que constrói o objeto `User` usado como
`principal` em toda a aplicação: é ele que o `JwtFilter` chama a cada requisição, e é ele que
`AuthService.login` usa pra decidir o que vai dentro do JWT.

```java
// antes
User user = new User(result.getFirst().getUsername(), result.getFirst().getPassword());
user.setId(result.getFirst().getId());
```

O construtor `User(String username, String password)` só seta `email` e `password` — nunca toca
em `firstLogin`. Como o campo tem valor padrão `private boolean firstLogin = true;` na
declaração da entidade, e nada o sobrescrevia aqui, **todo `User` reconstruído por esse método
nascia com `firstLogin = true`**, independente do que estava no banco.

A causa mais profunda: a query nativa que alimenta esse método (`searchUserAndRolesByEmail`) nem
selecionava a coluna `first_login` — não tinha como saber o valor real mesmo se alguém tentasse
usá-lo.

Isso não era um problema de entidade "não gerenciada" pelo Hibernate (isso importaria só na hora
de salvar) — era simplesmente um dado que nunca foi buscado no banco pra esse objeto específico.

## Correção

Três arquivos, todos em `com.pfc.notus.user`:

1. **`projection/UserDetailsProjection.java`** — adicionado `Boolean getFirstLogin();`.
2. **`repository/UserRepository.java`** — a query nativa `searchUserAndRolesByEmail` agora
   seleciona `tb_user.first_login AS firstLogin`.
3. **`service/UserService.java`** (`loadUserByUsername`) — depois de montar o `User`, chama
   `user.setFirstLogin(Boolean.TRUE.equals(result.getFirst().getFirstLogin()))`.

## Como validar

1. Logar com um usuário do `import.sql` (todos com `first_login = FALSE`, senha `123456`) — deve
   ir direto pro painel do papel dele, sem passar por `/onboarding`.
2. Cadastrar um aluno novo via `/students` (nasce com `firstLogin = true` por padrão) — deve cair
   em `/onboarding` no primeiro login, e sair de lá (`firstLogin = false`) depois de completar
   `POST /users/me/onboarding`.

## Onde mais isso afeta

Qualquer código que dependa de `Authentication.getPrincipal()` (ou seja, tudo que passa pelo
`JwtFilter`) depende desse mesmo método. Se um dia `User` ganhar mais campos que o
`principal` precise refletir corretamente (ex.: `termsAcceptedAt`), o mesmo padrão de bug pode se
repetir — a projection e a query nativa precisam ser atualizadas junto.
