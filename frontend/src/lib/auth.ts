export type Role = "ROLE_ALUNO" | "ROLE_RESPONSAVEL" | "ROLE_PROFESSOR";

export type Session = {
  email: string;
  token: string;
  roles: Role[];
  expiresAt: string;
};

const STORAGE_KEY = "notus.session";

function decodeRoles(token: string): Role[] {
  try {
    const payload = token.split(".")[1] ?? "";
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { roles?: string[] };
    return (claims.roles ?? []).filter((r): r is Role => r.startsWith("ROLE_"));
  } catch {
    return [];
  }
}

export function saveSession(data: { email: string; token: string; expiresAt: string }): Session {
  const session: Session = { ...data, roles: decodeRoles(data.token) };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* localStorage indisponível (SSR ou navegador bloqueado) */
  }
  return session;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function homeForRoles(roles: Role[]): "/aluno" | "/responsavel" | "/professor" {
  if (roles.includes("ROLE_PROFESSOR")) return "/professor";
  if (roles.includes("ROLE_RESPONSAVEL")) return "/responsavel";
  return "/aluno";
}
