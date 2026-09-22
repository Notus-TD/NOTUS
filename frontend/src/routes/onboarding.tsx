import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsReaderDialog } from "@/components/TermsReaderDialog";
import { ApiError, completeOnboarding } from "@/lib/api";
import { clearSession, getSession, homeForRoles, markOnboardingComplete } from "@/lib/auth";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Primeiro acesso · NOTUS" }],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [termosLidos, setTermosLidos] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (!session.firstLogin) {
      navigate({ to: homeForRoles(session.roles), replace: true });
    }
  }, [navigate]);

  function sair() {
    clearSession();
    navigate({ to: "/login", replace: true });
  }

  async function concluir(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (novaSenha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (!termosLidos) {
      setErro("Abra e leia a política de privacidade antes de continuar.");
      return;
    }
    if (!aceitouTermos) {
      setErro("É preciso aceitar os termos para continuar.");
      return;
    }

    setEnviando(true);
    try {
      await completeOnboarding(novaSenha, aceitouTermos);
      markOnboardingComplete();
      toast.success("Senha alterada com sucesso.");
      const session = getSession();
      navigate({ to: session ? homeForRoles(session.roles) : "/login", replace: true });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro inesperado ao concluir o cadastro.");
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
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              NOTUS
            </span>
          </span>
          <Button variant="outline" className="min-h-11 text-base" onClick={sair}>
            <LogOut className="size-5" aria-hidden="true" />
            Sair
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Primeiro acesso
              </h1>
              <p className="text-base text-muted-foreground">
                Sua senha atual é o mesmo dado usado pra login. Defina uma nova senha antes de
                continuar.
              </p>
            </div>
          </div>

          <form onSubmit={concluir} className="mt-8 space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="nova-senha" className="block text-lg font-semibold text-foreground">
                Nova senha
              </label>
              <Input
                id="nova-senha"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="h-12 text-lg"
              />
              <p className="text-sm text-muted-foreground">Mínimo de 8 caracteres.</p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmar-senha"
                className="block text-lg font-semibold text-foreground"
              >
                Confirmar nova senha
              </label>
              <Input
                id="confirmar-senha"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-base font-semibold text-foreground">Termos de uso e privacidade</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ao continuar, você concorda que o NOTUS trate os dados acadêmicos e de contato
                cadastrados exclusivamente para a gestão escolar, conforme a Lei Geral de Proteção
                de Dados (LGPD). <TermsReaderDialog onConfirm={() => setTermosLidos(true)} />
              </p>
              {termosLidos && (
                <p className="mt-2 text-sm font-medium text-success">
                  ✓ Política de privacidade lida.
                </p>
              )}
            </div>

            <label
              className={`flex items-start gap-3 ${!termosLidos ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <Checkbox
                checked={aceitouTermos}
                disabled={!termosLidos}
                onCheckedChange={(v) => setAceitouTermos(v === true)}
                className="mt-1"
              />
              <span className="text-base text-foreground">
                {termosLidos
                  ? "Li e aceito os termos de uso e a política de privacidade."
                  : "Abra e leia a política de privacidade acima para liberar esta opção."}
              </span>
            </label>

            {erro && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-base text-destructive"
              >
                {erro}
              </p>
            )}

            <Button
              type="submit"
              disabled={enviando || !novaSenha || !confirmarSenha || !aceitouTermos}
              className="min-h-12 w-full text-lg"
            >
              {enviando ? "Salvando..." : "Concluir e entrar"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
