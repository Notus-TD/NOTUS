import { getToken } from "@/lib/sessao";

export const API_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:8080";

export async function postPublico(path: string, body: unknown): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }
}

export type StandardError = {
  status: number;
  message: string;
  errors?: { fieldName: string; message: string }[];
};

export class ApiError extends Error {
  status: number;
  fieldErrors: { fieldName: string; message: string }[];

  constructor(
    status: number,
    message: string,
    fieldErrors: { fieldName: string; message: string }[] = [],
  ) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// Usa a mensagem que a API manda (StandardError). 401 = sessão vencida ou ausente; 403 = sem permissão.
async function erroDaResposta(res: Response, padrao: string): Promise<ApiError> {
  const err = (await res.json().catch(() => null)) as StandardError | null;
  if (res.status === 401) return new ApiError(401, "Sua sessão expirou. Faça login novamente.");
  if (res.status === 403 && !err?.message) {
    return new ApiError(403, "Você não tem permissão para esta operação.");
  }
  return new ApiError(res.status, err?.message ?? padrao, err?.errors ?? []);
}

export async function getJson<T>(path: string): Promise<T> {
  const token = getToken();
  if (!token) throw new ApiError(401, "Faça login para continuar.");
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }
  if (!res.ok)
    throw await erroDaResposta(res, `Não foi possível carregar os dados (erro ${res.status}).`);
  return res.json();
}

export async function sendJson<T>(
  method: "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  if (!token) throw new ApiError(401, "Faça login para continuar.");
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body !== undefined ? JSON.stringify(body) : null,
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }
  if (!res.ok)
    throw await erroDaResposta(res, `Não foi possível concluir a operação (erro ${res.status}).`);
  if (res.status === 204) return undefined as T;
  return res.json();
}
