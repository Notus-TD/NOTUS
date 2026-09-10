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

O código é organizado por domínio (`atividade`, `boletim`, `disciplina`, `matricula`, `nota`, `turma`, `user`, `falta`), cada um com as camadas `domain`, `dto`, `repository`, `service` e `controller`.

### Como rodar

```bash
cd backend
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080`. Autenticação em `POST /auth/login`.

---

## Frontend (`frontend/`)

Aplicação web em React. *(Em fase inicial de estruturação.)*

| Tecnologia | Uso no projeto |
|---|---|
| **React** | Biblioteca para construção da interface por componentes. |
| **TypeScript** | Tipagem estática sobre o JavaScript; principal linguagem dos componentes. |
| **JavaScript** | Configurações e trechos sem tipagem. |
| **HTML** | Estrutura base da página (`index.html`) e marcação (JSX). |
| **CSS** | Estilização das telas e componentes. |

### Como rodar

```bash
cd frontend
npm install
npm run dev
```

---

## Fluxo geral

O frontend (React) consome a API REST do backend (Spring Boot) via HTTP, enviando o **token JWT** no cabeçalho `Authorization` após o login. O backend valida o token, aplica as regras de acesso por papel (`ROLE_ALUNO`, `ROLE_PROFESSOR`) e persiste os dados no banco.
