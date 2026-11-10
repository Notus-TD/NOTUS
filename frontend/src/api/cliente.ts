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

export async function getJson<T>(path: string): Promise<T> {
  const token = getToken();
  if (!token) throw new ApiError(401, "Faça login para continuar.");
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }
  if (res.status === 401 || res.status === 403)
    throw new ApiError(res.status, `Sem permissão para ${path}.`);
  if (!res.ok) throw new ApiError(res.status, `Falha em GET ${path}: ${res.status}`);
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
  if (res.status === 401 || res.status === 403)
    throw new ApiError(res.status, `Sem permissão para ${path}.`);
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as StandardError | null;
    throw new ApiError(
      res.status,
      err?.message ?? `Falha em ${method} ${path}: ${res.status}`,
      err?.errors ?? [],
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
