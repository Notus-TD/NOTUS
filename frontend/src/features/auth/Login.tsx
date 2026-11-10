import { login } from "@/api/auth";
import { ApiError } from "@/api/cliente";
import { MarcaNotus } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { esquecerEmail, lembrarEmail, lerEmailLembrado } from "@/features/auth/email-lembrado";
import { EsqueciSenhaForm } from "@/features/auth/EsqueciSenhaForm";
import { EtapaMfa } from "@/features/auth/EtapaMfa";
import { RodapeSite } from "@/features/legal/LegalPage";
import { getSession, homeForRoles, type Session } from "@/lib/sessao";
import { emailValido } from "@/lib/validacao";
import { Route } from "@/routes/login";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  Mail,
  Phone,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";

export function LoginPage() {
  const navigate = useNavigate();
  const { recuperar } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [modo, setModo] = useState<"entrar" | "recuperar">(recuperar ? "recuperar" : "entrar");
  const [mfa, setMfa] = useState<{
    etapa: "MFA" | "MFA_CADASTRO";
    email: string;
    desafio: string;
  } | null>(null);
  const focarEmailAposErro = useRef(false);
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

  useEffect(() => {
    if (enviando || !focarEmailAposErro.current) return;
    focarEmailAposErro.current = false;
    const campoEmail = document.getElementById("email");
    if (campoEmail instanceof HTMLInputElement) {
      campoEmail.focus();
      campoEmail.select();
    }
  }, [enviando]);

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

  function entrou(session: Session) {
    toast.success(`Bem-vindo(a), ${session.email}.`);
    navigate({
      to: session.firstLogin ? "/onboarding" : homeForRoles(session.roles),
      replace: true,
    });
  }

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    const campoEmail = e.currentTarget.elements.namedItem("email");
    const campoSenha = e.currentTarget.elements.namedItem("senha");
    const emailDigitado = campoEmail instanceof HTMLInputElement ? campoEmail.value : email;
    const senhaDigitada = campoSenha instanceof HTMLInputElement ? campoSenha.value : senha;
    setEmail(emailDigitado);
    setSenha(senhaDigitada);

    const erroEmail = validarEmail(emailDigitado);
    const erroSenha = validarSenha(senhaDigitada);
    setTocados({ email: true, senha: true });
    setErrosCampo({ email: erroEmail, senha: erroSenha });
    if (erroEmail || erroSenha) {
      document.getElementById(erroEmail ? "email" : "senha")?.focus();
      return;
    }

    setEnviando(true);
    try {
      const resultado = await login(emailDigitado.trim(), senhaDigitada);
      if (lembrar) lembrarEmail(emailDigitado.trim());
      else esquecerEmail();
      if (resultado.etapa === "CONCLUIDO") {
        entrou(resultado.session);
        return;
      }
      setSenha("");
      setMfa(resultado);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro inesperado ao entrar.");
      focarEmailAposErro.current = true;
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-card">
      <aside className="relative hidden w-[44%] max-w-2xl flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:28px_28px] opacity-10"
        />
        <MarcaNotus clara className="relative" />
        <div className="relative max-w-md space-y-4">
          <p className="font-display text-4xl font-bold leading-tight tracking-tight">
            Colégio Notus
          </p>
          <p className="text-lg text-primary-foreground/80">
            Escola e família, juntas em cada etapa.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/70">Colégio Notus · 2026</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <img
              src="/notus-logo.png"
              alt="NOTUS"
              width={480}
              height={442}
              className="mx-auto mb-10 h-auto w-28 lg:hidden"
            />
            {modo === "recuperar" ? (
              <EsqueciSenhaForm emailInicial={email.trim()} aoVoltar={() => setModo("entrar")} />
            ) : mfa ? (
              <EtapaMfa
                etapa={mfa.etapa}
                email={mfa.email}
                desafio={mfa.desafio}
                aoConcluir={entrou}
                aoVoltar={() => setMfa(null)}
              />
            ) : (
              <>
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                  Entrar no portal
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                  Use o e-mail cadastrado na escola.
                </p>

                <form onSubmit={entrar} className="mt-8 space-y-5" noValidate>
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-base font-semibold text-foreground"
                    >
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
                          setErrosCampo((atual) => ({
                            ...atual,
                            email: validarEmail(e.target.value),
                          }));
                      }}
                      onBlur={(e) => {
                        const valor = e.target.value;
                        setEmail(valor);
                        setTocados((t) => ({ ...t, email: true }));
                        setErrosCampo((atual) => ({ ...atual, email: validarEmail(valor) }));
                      }}
                      placeholder="nome@escola.edu.br"
                      aria-invalid={errosCampo.email ? true : undefined}
                      aria-describedby={errosCampo.email ? "email-erro" : undefined}
                      className={`h-11 text-base ${errosCampo.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
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
                    <div className="flex items-baseline justify-between gap-3">
                      <label
                        htmlFor="senha"
                        className="block text-base font-semibold text-foreground"
                      >
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setErro(null);
                          setModo("recuperar");
                        }}
                        disabled={enviando}
                        className="rounded text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
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
                            setErrosCampo((atual) => ({
                              ...atual,
                              senha: validarSenha(e.target.value),
                            }));
                        }}
                        onBlur={(e) => {
                          const valor = e.target.value;
                          setSenha(valor);
                          setTocados((t) => ({ ...t, senha: true }));
                          setErrosCampo((atual) => ({ ...atual, senha: validarSenha(valor) }));
                          setCapsLock(false);
                        }}
                        onKeyDown={verificarCapsLock}
                        onKeyUp={verificarCapsLock}
                        aria-invalid={errosCampo.senha ? true : undefined}
                        aria-describedby={errosCampo.senha ? "senha-erro" : undefined}
                        className={`h-11 pr-12 text-base ${errosCampo.senha ? "border-destructive focus-visible:ring-destructive" : ""}`}
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
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 py-3 pl-4 pr-2 text-destructive"
                    >
                      <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                      <div className="flex-1 space-y-0.5">
                        <p className="text-base font-semibold">Não foi possível entrar</p>
                        <p className="text-sm">{erro}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setErro(null)}
                        aria-label="Fechar aviso"
                        title="Fechar aviso"
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={enviando}
                    aria-busy={enviando}
                    className="min-h-11 w-full text-base"
                  >
                    {enviando ? (
                      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    ) : (
                      <LogIn className="size-5" aria-hidden="true" />
                    )}
                    {enviando ? "Entrando..." : "Entrar"}
                  </Button>
                </form>

                <p className="mt-6 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Primeiro acesso?</span> Abra o
                  link que a escola enviou para o seu e-mail para criar sua senha. Se ele expirou,
                  use &quot;Esqueci minha senha&quot;.
                </p>

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
              </>
            )}
          </div>
        </main>

        <RodapeSite largura="centro" />
      </div>
    </div>
  );
}
