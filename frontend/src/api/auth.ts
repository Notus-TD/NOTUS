import { API_URL, ApiError, getJson, postPublico, sendJson, StandardError } from "@/api/cliente";
import { saveSession, type Session } from "@/lib/sessao";

export type RespostaLogin = {
  etapa: "CONCLUIDO" | "MFA" | "MFA_CADASTRO";
  email: string;
  token: string | null;
  expiresAt: string | null;
  desafio: string | null;
};

export type ResultadoLogin =
  | { etapa: "CONCLUIDO"; session: Session }
  | { etapa: "MFA" | "MFA_CADASTRO"; email: string; desafio: string };

export type MfaCadastroDTO = { uri: string; segredo: string };

function concluirLogin(data: RespostaLogin): ResultadoLogin {
  if (data.etapa === "CONCLUIDO" && data.token && data.expiresAt) {
    return {
      etapa: "CONCLUIDO",
      session: saveSession({ email: data.email, token: data.token, expiresAt: data.expiresAt }),
    };
  }
  if (data.etapa !== "CONCLUIDO" && data.desafio) {
    return { etapa: data.etapa, email: data.email, desafio: data.desafio };
  }
  throw new ApiError(500, "Resposta de login inesperada.");
}

async function postMfa<T>(path: string, body: unknown): Promise<T> {
  const res = await postPublico(path, body);
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as StandardError | null;
    throw new ApiError(
      res.status,
      err?.message ?? `Falha em ${path}: ${res.status}`,
      err?.errors ?? [],
    );
  }
  return res.json() as Promise<T>;
}

export const iniciarCadastroMfa = (desafio: string) =>
  postMfa<MfaCadastroDTO>("/auth/mfa/cadastro", { desafio });

export const confirmarCadastroMfa = async (desafio: string, codigo: string) =>
  concluirLogin(await postMfa<RespostaLogin>("/auth/mfa/cadastro/confirmar", { desafio, codigo }));

export const verificarMfa = async (desafio: string, codigo: string) =>
  concluirLogin(await postMfa<RespostaLogin>("/auth/mfa/verificar", { desafio, codigo }));

export async function login(email: string, password: string): Promise<ResultadoLogin> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }
  if (res.status === 401 || res.status === 403) {
    throw new ApiError(res.status, "E-mail ou senha incorretos.");
  }
  if (res.status === 429) {
    const err = (await res.json().catch(() => null)) as StandardError | null;
    throw new ApiError(
      res.status,
      err?.message ?? "Muitas tentativas de login. Aguarde alguns minutos e tente de novo.",
    );
  }
  if (!res.ok) throw new ApiError(res.status, `Login falhou: ${res.status}`);
  return concluirLogin((await res.json()) as RespostaLogin);
}

export async function solicitarRedefinicaoSenha(email: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/esqueci-senha`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }
  if (res.status === 422) throw new ApiError(res.status, "Informe um e-mail válido.");
  if (res.status === 429) {
    throw new ApiError(res.status, "Muitas tentativas seguidas. Aguarde alguns minutos.");
  }
  if (!res.ok) {
    throw new ApiError(
      res.status,
      "Não foi possível enviar o link agora. Tente mais tarde ou procure a secretaria da escola.",
    );
  }
}

export type TipoTokenSenha = "CONVITE" | "REDEFINICAO";

export type TokenSenhaDTO = { tipo: TipoTokenSenha; emailMascarado: string };

export const LINK_INVALIDO = "Este link é inválido ou já expirou. Peça um novo link.";

export async function validarTokenSenha(token: string): Promise<TokenSenhaDTO> {
  const res = await postPublico("/auth/token-senha/validar", { token });
  if (res.status === 422) throw new ApiError(res.status, LINK_INVALIDO);
  if (!res.ok) throw new ApiError(res.status, `Falha ao verificar o link: ${res.status}`);
  return res.json();
}

export async function definirSenha(
  token: string,
  novaSenha: string,
  aceiteTermos: boolean,
): Promise<void> {
  const res = await postPublico("/auth/definir-senha", { token, novaSenha, aceiteTermos });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as StandardError | null;
    throw new ApiError(
      res.status,
      res.status === 422 && err?.message ? err.message : `Falha ao salvar a senha: ${res.status}`,
      err?.errors ?? [],
    );
  }
}

export type DependenteDTO = { id: number; nome: string };

export type MeuPerfilDTO = {
  email: string;
  roles: string[];
  nome: string | null;
  dependentes: DependenteDTO[];
};

export const getMeuPerfil = () => getJson<MeuPerfilDTO>("/auth/me");

export const completeOnboarding = (newPassword: string, acceptTerms: boolean) =>
  sendJson<void>("POST", "/users/me/onboarding", { newPassword, acceptTerms });
