const CHAVE_EMAIL_LEMBRADO = "notus.ultimoEmail";

export function lerEmailLembrado(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(CHAVE_EMAIL_LEMBRADO) ?? "";
  } catch {
    return "";
  }
}

export function lembrarEmail(email: string) {
  try {
    localStorage.setItem(CHAVE_EMAIL_LEMBRADO, email);
  } catch {
    return;
  }
}

export function esquecerEmail() {
  try {
    localStorage.removeItem(CHAVE_EMAIL_LEMBRADO);
  } catch {
    return;
  }
}
