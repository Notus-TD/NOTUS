import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Info, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, login } from "@/lib/api";
import { getSession, homeForRoles } from "@/lib/auth";
import { emailValido } from "@/lib/validacao";

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
  const [errosCampo, setErrosCampo] = useState<{
    email?: string | undefined;
    senha?: string | undefined;
  }>({});
  const [tocados, setTocados] = useState<{ email?: boolean; senha?: boolean }>({});

  useEffect(() => {
    const session = getSession();
    if (session) navigate({ to: homeForRoles(session.roles), replace: true });
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
      toast.success(`Bem-vindo(a), ${session.email}.`);
      navigate({ to: homeForRoles(session.roles), replace: true });
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
          <p className="mt-2 text-base text-muted-foreground">
            Use o e-mail cadastrado na escola.
          </p>

          <div className="mt-4 flex items-start gap-3 rounded-xl border-2 border-primary bg-primary/5 p-4">
            <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-base text-foreground">
              <strong>Primeiro acesso?</strong> Sua senha inicial é o próprio e-mail cadastrado na
              escola.
            </p>
          </div>

          <form onSubmit={entrar} className="mt-6 space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-lg font-semibold text-foreground">
                E-mail
              </label>
              <Input
                id="email"
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
                <p id="email-erro" className="text-base font-medium text-destructive">
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
                  }}
                  aria-invalid={errosCampo.senha ? true : undefined}
                  aria-describedby={errosCampo.senha ? "senha-erro" : undefined}
                  className={`h-12 pr-12 text-lg ${errosCampo.senha ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={verSenha}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {verSenha ? (
                    <EyeOff className="size-5" aria-hidden="true" />
                  ) : (
                    <Eye className="size-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errosCampo.senha && (
                <p id="senha-erro" className="text-base font-medium text-destructive">
                  {errosCampo.senha}
                </p>
              )}
            </div>

            {erro && (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-base text-destructive">
                {erro}
              </p>
            )}

            <Button type="submit" disabled={enviando} className="min-h-12 w-full text-lg">
              <LogIn className="size-5" aria-hidden="true" />
              {enviando ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-base text-muted-foreground">
            Ainda não tem uma conta? Fale com a secretaria:{" "}
            <a href="mailto:secretaria@colegionotus.com.br" className="font-semibold text-primary hover:underline">
              secretaria@colegionotus.com.br
            </a>
          </p>
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-base text-muted-foreground sm:px-6">
          NOTUS · Portal de gestão escolar · Dúvidas: secretaria@colegionotus.com.br · (11) 4002-8922
        </div>
      </footer>
    </div>
  );
}
