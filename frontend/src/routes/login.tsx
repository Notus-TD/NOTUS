import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, login } from "@/lib/api";
import { getSession, homeForRoles } from "@/lib/auth";

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

  useEffect(() => {
    const session = getSession();
    if (session) navigate({ to: homeForRoles(session.roles), replace: true });
  }, [navigate]);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
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
            Use o e-mail cadastrado na escola. No primeiro acesso, a senha é o próprio e-mail.
          </p>

          <form onSubmit={entrar} className="mt-8 space-y-5" noValidate>
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@escola.edu.br"
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="senha" className="block text-lg font-semibold text-foreground">
                Senha
              </label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            {erro && (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-base text-destructive">
                {erro}
              </p>
            )}

            <Button type="submit" disabled={enviando || !email || !senha} className="min-h-12 w-full text-lg">
              <LogIn className="size-5" aria-hidden="true" />
              {enviando ? "Entrando..." : "Entrar"}
            </Button>
          </form>
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
