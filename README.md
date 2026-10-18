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

O código é organizado por domínio (`atividade`, `boletim`, `disciplina`, `entrega`, `falta`, `presenca`, `nota`, `turma`, `user`), cada um com as camadas `domain`, `dto`, `repository`, `service` e `controller`.

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
| `SUPABASE_DB_URL` | não | conexão direta do projeto (`db.jvznbyhigagxgbihnpmx.supabase.co:5432`) |
| `SUPABASE_DB_USER` | não | `postgres` |
| `SUPABASE_DDL_AUTO` | não | `update` |

**Primeira subida (cria as tabelas e carrega os dados de exemplo do `import.sql`)** — no PowerShell:

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE = "supabase"
$env:SUPABASE_DB_PASSWORD = "<senha do banco>"
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

---

## Fluxo geral

O frontend (React) consome a API REST do backend (Spring Boot) via HTTP, enviando o **token JWT** no cabeçalho `Authorization` após o login. O backend valida o token, aplica as regras de acesso por papel (`ROLE_ALUNO`, `ROLE_PROFESSOR`) e persiste os dados no banco.
