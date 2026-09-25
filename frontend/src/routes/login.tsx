import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Info,
  Loader2,
  LogIn,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { LinksLegais } from "@/components/LegalPage";
import { ApiError, login } from "@/lib/api";
import { getSession, homeForRoles } from "@/lib/auth";
import { emailValido } from "@/lib/validacao";

const CHAVE_EMAIL_LEMBRADO = "notus.ultimoEmail";

function lerEmailLembrado(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(CHAVE_EMAIL_LEMBRADO) ?? "";
  } catch {
    return "";
  }
}

function lembrarEmail(email: string) {
  try {
    localStorage.setItem(CHAVE_EMAIL_LEMBRADO, email);
  } catch {
    /* navegador sem acesso ao armazenamento: segue sem lembrar */
  }
}

function esquecerEmail() {
  try {
    localStorage.removeItem(CHAVE_EMAIL_LEMBRADO);
  } catch {
    /* navegador sem acesso ao armazenamento: nada a apagar */
  }
}

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar · NOTUS" },
      { name: "description", content: "Acesse o portal escolar NOTUS com seu e-mail e senha." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [errosCampo, setErrosCampo] = useState<{
    email?: string | undefined;
    senha?: string | undefined;
  }>({});
  const [tocados, setTocados] = useState<{ email?: boolean; senha?: boolean }>({});

  useEffect(() => {
    const session = getSession();
    if (session) {
      navigate({
        to: session.firstLogin ? "/onboarding" : homeForRoles(session.roles),
        replace: true,
      });
      return;
    }
    const lembrado = lerEmailLembrado();
    if (lembrado) {
      setEmail(lembrado);
      setLembrar(true);
      document.getElementById("senha")?.focus();
    }
  }, [navigate]);

  function validarEmail(v: string): string | undefined {
    if (!v.trim()) return "Informe o e-mail.";
    if (!emailValido(v)) return "Informe um e-mail válido.";
    return undefined;
  }

  function validarSenha(v: string): string | undefined {
    if (!v) return "Informe a senha.";
    return undefined;
  }

  function verificarCapsLock(e: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState("CapsLock"));
  }

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    const erroEmail = validarEmail(email);
    const erroSenha = validarSenha(senha);
    setTocados({ email: true, senha: true });
    setErrosCampo({ email: erroEmail, senha: erroSenha });
    if (erroEmail || erroSenha) {
      document.getElementById(erroEmail ? "email" : "senha")?.focus();
      return;
    }

    setEnviando(true);
    try {
      const session = await login(email.trim(), senha);
      if (lembrar) lembrarEmail(email.trim());
      else esquecerEmail();
      toast.success(`Bem-vindo(a), ${session.email}.`);
      navigate({
        to: session.firstLogin ? "/onboarding" : homeForRoles(session.roles),
        replace: true,
      });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro inesperado ao entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
              N
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">NOTUS</span>
          </span>
          <span className="hidden text-base text-muted-foreground sm:block">Colégio Notus · 2026</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Entrar</h1>
          <p className="mt-2 text-base text-muted-foreground">Use o e-mail cadastrado na escola.</p>

          <div
            role="note"
            className="mt-5 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Info className="size-4 text-primary" aria-hidden="true" />
            </span>
            <div className="space-y-0.5">
              <p className="text-base font-semibold text-foreground">Primeiro acesso?</p>
              <p className="text-sm text-muted-foreground">
                Sua senha inicial é o próprio e-mail cadastrado. Logo depois de entrar, você vai
                criar uma senha nova.
              </p>
            </div>
          </div>

          <form onSubmit={entrar} className="mt-6 space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-lg font-semibold text-foreground">
                E-mail
              </label>
              <Input
                id="email"
                disabled={enviando}
                type="email"
                autoComplete="username"
                required
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (tocados.email)
                    setErrosCampo((atual) => ({ ...atual, email: validarEmail(e.target.value) }));
                }}
                onBlur={() => {
                  setTocados((t) => ({ ...t, email: true }));
                  setErrosCampo((atual) => ({ ...atual, email: validarEmail(email) }));
                }}
                placeholder="nome@escola.edu.br"
                aria-invalid={errosCampo.email ? true : undefined}
                aria-describedby={errosCampo.email ? "email-erro" : undefined}
                className={`h-12 text-lg ${errosCampo.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errosCampo.email && (
                <p
                  id="email-erro"
                  className="flex items-center gap-1.5 text-sm font-medium text-destructive"
                >
                  <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                  {errosCampo.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="senha" className="block text-lg font-semibold text-foreground">
                Senha
              </label>
              <div className="relative">
                <Input
                  id="senha"
                  disabled={enviando}
                  type={verSenha ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    if (tocados.senha)
                      setErrosCampo((atual) => ({ ...atual, senha: validarSenha(e.target.value) }));
                  }}
                  onBlur={() => {
                    setTocados((t) => ({ ...t, senha: true }));
                    setErrosCampo((atual) => ({ ...atual, senha: validarSenha(senha) }));
                    setCapsLock(false);
                  }}
                  onKeyDown={verificarCapsLock}
                  onKeyUp={verificarCapsLock}
                  aria-invalid={errosCampo.senha ? true : undefined}
                  aria-describedby={errosCampo.senha ? "senha-erro" : undefined}
                  className={`h-12 pr-12 text-lg ${errosCampo.senha ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  disabled={enviando}
                  aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={verSenha}
                  aria-controls="senha"
                  title={verSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  {verSenha ? (
                    <EyeOff className="size-5" aria-hidden="true" />
                  ) : (
                    <Eye className="size-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {capsLock && (
                <p
                  role="status"
                  className="inline-flex items-center gap-1.5 rounded-md bg-warning/10 px-2.5 py-1 text-sm font-medium text-warning"
                >
                  <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                  Caps Lock está ativado
                </p>
              )}
              {errosCampo.senha && (
                <p
                  id="senha-erro"
                  className="flex items-center gap-1.5 text-sm font-medium text-destructive"
                >
                  <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                  {errosCampo.senha}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <Checkbox
                id="lembrar-email"
                checked={lembrar}
                onCheckedChange={(v) => setLembrar(v === true)}
                disabled={enviando}
                className="size-5"
              />
              <label
                htmlFor="lembrar-email"
                className="cursor-pointer select-none text-base text-foreground"
              >
                Lembrar meu e-mail neste dispositivo
              </label>
            </div>

            {erro && (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-base text-destructive">
                {erro}
              </p>
            )}

            <Button
              type="submit"
              disabled={enviando}
              aria-busy={enviando}
              className="min-h-12 w-full text-lg"
            >
              {enviando ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <LogIn className="size-5" aria-hidden="true" />
              )}
              {enviando ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-5 text-center">
            <p className="text-base text-muted-foreground">
              Ainda não tem uma conta? Fale com a secretaria:
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <a
                href="mailto:secretaria@colegionotus.com.br"
                className="inline-flex items-center gap-1.5 rounded text-base font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Mail className="size-4" aria-hidden="true" />
                secretaria@colegionotus.com.br
              </a>
              <a
                href="tel:+551140028922"
                className="inline-flex items-center gap-1.5 rounded text-base font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Phone className="size-4" aria-hidden="true" />
                (11) 4002-8922
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-base text-muted-foreground sm:px-6">
          <span>
            NOTUS · Portal de gestão escolar · Dúvidas: secretaria@colegionotus.com.br · (11) 4002-8922
          </span>
          <LinksLegais />
        </div>
      </footer>
    </div>
  );
}
