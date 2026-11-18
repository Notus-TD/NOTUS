# NOTUS

Sistema acadêmico para gestão de alunos, disciplinas, turmas, atividades, boletins, notas e faltas.
O projeto é dividido em dois módulos: **`backend/`** (API REST) e **`frontend/`** (aplicação web).

---

## Backend (`backend/`)

API REST em Java com Spring Boot.

| Tecnologia | Uso no projeto |
|---|---|
| **Java 21** | Linguagem base (versão LTS definida no `pom.xml` e no CI). |
| **Spring Boot 4.1.1** | Framework principal; autoconfiguração, injeção de dependências e servidor embarcado. |
| **Spring Web MVC** (`spring-boot-starter-webmvc`) | Criação dos endpoints REST (`@RestController`, `@RequestMapping`). |
| **Spring Data JPA + Hibernate** | Mapeamento objeto-relacional (entidades `@Entity`) e repositórios (`JpaRepository`). |
| **Spring Security** | Proteção dos endpoints e controle de acesso por papel (`@EnableMethodSecurity`, `@PreAuthorize`). |
| **JWT** (`com.auth0:java-jwt` 4.5.0) | Autenticação stateless via token Bearer (`JwtTokenProvider`, `JwtFilter`). |
| **BCrypt** | Hash das senhas dos usuários. |
| **Banco H2** (em memória) | Base de dados de desenvolvimento; console em `/h2-console`. Carga inicial via `import.sql`. |
| **Hibernate Validator** (Bean Validation) | Validação dos DTOs de entrada (`@Valid`, `@NotBlank`, `@NotNull`). |
| **Lombok** | Redução de boilerplate (`@Getter`, `@Setter`, `@NoArgsConstructor`). |
| **Maven** (`mvnw` wrapper) | Build e gerenciamento de dependências. |
| **GitHub Actions** | Pipeline de CI: build com `mvn package` e publicação do artifact (`.github/workflows/pipeline.yaml`). |

### Organização

O código é organizado por domínio (`atividade`, `boletim`, `calendario`, `comunicado`, `disciplina`, `entrega`, `falta`, `lecionamento`, `nota`, `notificacao`, `privacidade`, `turma`, `user`), cada um com as camadas `domain`, `dto`, `repository`, `service` e `controller`.

### Como rodar

```bash
cd backend
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080`. Autenticação em `POST /auth/login`.

Por padrão o backend usa o perfil `h2` (banco em memória, recriado a cada subida).

### Rodando com o Supabase

O perfil `supabase` usa o PostgreSQL hospedado no Supabase. As tabelas ficam no schema `notus` (e não no `public`, que o Supabase expõe pela Data API). A configuração vem de variáveis de ambiente:

| Variável | Obrigatória | Padrão |
|---|---|---|
| `SUPABASE_DB_PASSWORD` | sim | — (senha do banco, definida no painel do Supabase) |
| `JWT_SECRET` | sim | — (chave que assina os tokens de login; pelo menos 32 caracteres aleatórios, ex.: `openssl rand -base64 48`) |
| `MFA_CHAVE` | sim | — (chave que cifra no banco o segredo do aplicativo autenticador de cada usuário; pelo menos 32 caracteres aleatórios, ex.: `openssl rand -base64 48`). Se ela mudar, todos os professores e administradores precisam cadastrar o aplicativo de novo |
| `SUPABASE_DB_URL` | sim | — (URL JDBC do *Session pooler* do Supabase, em **Connect**; a conexão direta `db.*.supabase.co` só funciona por IPv6) |
| `SUPABASE_DB_USER` | não | `postgres` |
| `SUPABASE_DDL_AUTO` | não | `update` |

**Primeira subida (cria as tabelas e carrega os dados de exemplo do `import.sql`)** — no PowerShell:

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE = "supabase"
$env:SUPABASE_DB_PASSWORD = "<senha do banco>"
$env:JWT_SECRET = "<chave aleatória com 32+ caracteres>"
$env:MFA_CHAVE = "<outra chave aleatória com 32+ caracteres>"
$env:SUPABASE_DDL_AUTO = "create"
./mvnw spring-boot:run
```

> ⚠️ `create` **apaga e recria todas as tabelas** a cada subida. Depois da primeira vez, remova a variável (`Remove-Item Env:SUPABASE_DDL_AUTO`) para voltar ao padrão `update`, que preserva os dados.

**Subidas seguintes:** mesmos comandos, sem o `SUPABASE_DDL_AUTO`.

**Rede sem IPv6:** a conexão direta do Supabase só funciona por IPv6. Se a rede não tiver IPv6, a API não conecta ao banco. Nesse caso, use o *Session pooler* (painel do Supabase → **Connect**), que funciona por IPv4:

```powershell
$env:SUPABASE_DB_URL = "jdbc:postgresql://<host do session pooler>:5432/postgres?sslmode=require"
$env:SUPABASE_DB_USER = "postgres.jvznbyhigagxgbihnpmx"
```

**Banco que já existia antes desta versão:** o `update` cria as tabelas novas (`tb_periodo_letivo` e `tb_solicitacao_titular`) sozinho, mas as mudanças em colunas existentes precisam dos scripts de `backend/scripts/`. Rode-os nesta ordem, no SQL Editor do Supabase, antes de subir o backend novo:

1. `migracao-matricula-cancelada.sql`: aceita a situação `CANCELADA` na matrícula.
2. `migracao-chamada.sql`: guarda quantas aulas houve no dia e o ano letivo de aulas e faltas.
3. `migracao-acesso-aluno.sql`: acesso do aluno liberado pelo responsável; e-mail do aluno opcional.
4. `migracao-mfa.sql`: colunas da verificação em duas etapas.

Depois de subir, o administrador cadastra o calendário letivo do ano em **Sistema → Calendário letivo**. Sem ele, o sistema não fecha bimestres nem confere a data da chamada.

### Segurança

- **Verificação em duas etapas (MFA):** administradores e professores entram com a senha e um código de 6 dígitos do Google Authenticator ou do Microsoft Authenticator (TOTP, RFC 6238). No primeiro acesso, eles leem um QR code e confirmam o código. Se trocarem de celular, o administrador usa **Redefinir verificação** na lista de professores.
- **Acesso do aluno:** o aluno só entra no portal depois que o responsável libera o acesso na área dele (LGPD, art. 14).
- **Logs (Loki e Grafana):** no `docker-compose.yml`, Loki, Grafana, PostgreSQL e pgAdmin só aceitam conexões da própria máquina (`127.0.0.1`). O Grafana não tem acesso anônimo: o usuário é `admin`, com a senha de `GRAFANA_ADMIN_PASSWORD` (ou `admin`, e o Grafana pede a troca no primeiro acesso).

### LGPD no sistema

- Cópia dos dados em JSON e pedidos de correção ou anonimização pelo responsável, em **Meus dados**. A secretaria responde em **Sistema → Anonimização (LGPD)**, com prazo de 15 dias (art. 18).
- Avisos por e-mail guardados por 6 meses e apagados por uma rotina diária (`notificacao.retencao-cron`, padrão todo dia às 3h).
- Registros de acesso no Loki guardados por 6 meses (Marco Civil da Internet, art. 15).

---

## Frontend (`frontend/`)

Aplicação web em React, construída com TanStack Start, já com telas separadas por papel de usuário (admin, professor, aluno e responsável) e fluxo de login/cadastro integrado à API.

| Tecnologia | Uso no projeto |
|---|---|
| **React 19** | Biblioteca para construção da interface por componentes. |
| **TanStack Start** | Framework de roteamento e SSR/build sobre o React. |
| **TypeScript** | Tipagem estática; principal linguagem dos componentes. |
| **Tailwind CSS** | Estilização das telas e componentes. |
| **Radix UI / shadcn** | Biblioteca de componentes de UI acessíveis (dialogs, dropdowns, etc.). |
| **React Hook Form** | Controle e validação dos formulários. |

### Como rodar

```bash
cd frontend
npm install
npm run dev
```

### Organização (`frontend/src/`)

Organizado por funcionalidade, espelhando os pacotes do backend:

| Pasta | Conteúdo |
|---|---|
| `routes/` | Só as rotas (o TanStack Router transforma cada arquivo daqui em uma URL). Cada rota só registra a URL e o título e chama a tela de `features/`. |
| `features/admin/` | Telas da secretaria: `alunos/`, `professores/`, `turmas/`, `disciplinas/`, `comunicados/`, `notificacoes/`, `anonimizacao/`, calendário letivo, visão geral e dashboard; `comum/` tem botões e confirmações usados por várias telas. |
| `features/professor/` | Chamada, notas, `atividades/` (com entregas) e comunicados da turma. |
| `features/familia/` | Portal do `responsavel/` e do `aluno/`, com o boletim e o resumo em comum (`PortalFamilia.tsx`). |
| `features/auth/` | Login, verificação em duas etapas, primeiro acesso e redefinição de senha. |
| `features/legal/` | Política de Privacidade, Termos de Uso e o `historico/` das versões aceitas. |
| `api/` | Chamadas ao backend e tipos dos DTOs, um arquivo por domínio; `cliente.ts` tem o `fetch` com o token. |
| `components/layout/` | Estrutura das telas logadas (cabeçalho, menu, painéis, etiquetas). |
| `components/ui/` | Componentes do shadcn (não editar à mão). |
| `lib/` | Utilitários sem tela: sessão, datas, validação, bimestres, entregas. |
| `hooks/` | Hooks compartilhados (`use-carga`). |

Regras: uma tela por arquivo; componentes em PascalCase (`Chamada.tsx`) e utilitários em kebab-case (`email-lembrado.ts`); só `api/` faz `fetch`.

---

## Fluxo geral

O frontend (React) consome a API REST do backend (Spring Boot) via HTTP, enviando o **token JWT** no cabeçalho `Authorization` após o login. O backend valida o token, aplica as regras de acesso por papel (`ROLE_ALUNO`, `ROLE_PROFESSOR`) e persiste os dados no banco.

---

## Instruções e evidências de execução

Passo a passo para subir o sistema localmente e verificar as principais funcionalidades e integrações apresentadas na monografia. Os dados abaixo são fictícios, carregados pelo `import.sql` no perfil `h2` — **não há senhas, tokens ou dados pessoais reais envolvidos**.

### 1. Subindo o sistema

```bash
cd backend
./mvnw spring-boot:run
```

```bash
cd frontend
npm install
npm run dev
```

Backend em `http://localhost:8080`, frontend em `http://localhost:3000` (porta padrão do Vite/TanStack Start).

### 2. Logins de exemplo (perfil `h2`, dados fictícios)

| Perfil | E-mail de exemplo |
|---|---|
| Administrador | `admin@notus.com` |
| Professor | `pedro.professor@gmail.com` |
| Responsável | `marta.responsavel@gmail.com` |
| Aluno | `ana.aluna@gmail.com` |

A senha de todas as contas de exemplo é a senha de teste definida no ambiente de desenvolvimento local (não documentada aqui por ser um dado de acesso, ainda que fictício). Administrador e professor passam pela verificação em duas etapas (MFA) no primeiro acesso.

### 3. Funcionalidades a verificar

- **Login e papéis de acesso:** entrar com cada perfil acima e confirmar que cada um só enxerga as telas do seu papel (admin, professor, responsável, aluno).
- **MFA:** no primeiro login de um professor ou administrador, o sistema pede o cadastro do aplicativo autenticador (QR code) antes de liberar o acesso.
- **Lançamento de nota/falta/atividade:** como professor, lançar uma nota, uma falta e publicar uma atividade para uma turma; conferir o bloqueio automático ao tentar lançar fora do bimestre letivo aberto (cadastrado em Sistema → Calendário letivo).
- **Boletim:** como aluno ou responsável, conferir que a nota lançada aparece no boletim do bimestre correto.
- **Alocação de alunos em lote (RF13):** como administrador, associar vários alunos a uma turma de uma vez.
- **Edição de cadastro (RF01):** como administrador, editar os dados de um aluno ou responsável já cadastrado.
- **Notificações (RF12):** como administrador, conferir o histórico de notificações geradas pelos eventos acima (falta, nota, atividade).
- **Integração de e-mail (Resend):** ao lançar uma falta, nota ou atividade, o sistema dispara uma notificação por e-mail via Resend; em ambiente local de testes, configure uma chave de API de teste própria (variável de ambiente, nunca commitada) para validar o envio.
- **LGPD:** como responsável, solicitar a cópia dos dados (JSON) em "Meus dados"; como administrador, responder a uma solicitação de anonimização em Sistema → Anonimização (LGPD).

### 4. Evidências

As evidências de execução (prints de tela, vídeo de demonstração) ficam fora deste README e são anexadas separadamente na entrega, mostrando os fluxos acima rodando com os dados fictícios de exemplo.
