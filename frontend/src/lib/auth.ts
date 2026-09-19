export type Role = "ROLE_ALUNO" | "ROLE_RESPONSAVEL" | "ROLE_PROFESSOR" | "ROLE_ADMIN";

export type Session = {
  email: string;
  token: string;
  roles: Role[];
  userId: number | null;
  expiresAt: string;
};

const STORAGE_KEY = "notus.session";

function decodeClaims(token: string): { roles: Role[]; userId: number | null } {
  try {
    const payload = token.split(".")[1] ?? "";
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { roles?: string[]; id?: number };
    return {
      roles: (claims.roles ?? []).filter((r): r is Role => r.startsWith("ROLE_")),
      userId: claims.id ?? null,
    };
  } catch {
    return { roles: [], userId: null };
  }
}

export function saveSession(data: { email: string; token: string; expiresAt: string }): Session {
  const session: Session = { ...data, ...decodeClaims(data.token) };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
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

export function homeForRoles(roles: Role[]): "/admin" | "/aluno" | "/responsavel" | "/professor" {
  if (roles.includes("ROLE_ADMIN")) return "/admin";
  if (roles.includes("ROLE_PROFESSOR")) return "/professor";
  if (roles.includes("ROLE_RESPONSAVEL")) return "/responsavel";
  return "/aluno";
}
