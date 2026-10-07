import { useState, type FormEvent } from "react";
import { AlertCircle, ArrowLeft, HelpCircle, Loader2, Mail, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, solicitarRedefinicaoSenha } from "@/lib/api";
import { emailValido } from "@/lib/validacao";

function validarEmail(v: string): string | undefined {
  if (!v.trim()) return "Informe o e-mail.";
  if (!emailValido(v)) return "Informe um e-mail válido.";
  return undefined;
}

export function EsqueciSenhaForm({ aoVoltar }: { aoVoltar: () => void }) {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroEmail, setErroEmail] = useState<string | undefined>();
  const [tocado, setTocado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    const erroValidacao = validarEmail(email);
    setTocado(true);
    setErroEmail(erroValidacao);
    if (erroValidacao) {
      document.getElementById("email-recuperacao")?.focus();
      return;
    }

    setEnviando(true);
    try {
      await solicitarRedefinicaoSenha(email.trim());
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro inesperado ao solicitar o link.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
        Esqueci minha senha
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        Informe o e-mail cadastrado na escola. Vamos enviar um link para você criar uma senha nova.
      </p>

      <form onSubmit={enviar} className="mt-6 space-y-5" noValidate>
        <div className="space-y-2">
          <label
            htmlFor="email-recuperacao"
            className="block text-lg font-semibold text-foreground"
          >
            E-mail
          </label>
          <Input
            id="email-recuperacao"
            type="email"
            autoComplete="email"
            autoFocus
            disabled={enviando}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (tocado) setErroEmail(validarEmail(e.target.value));
            }}
            onBlur={() => {
              setTocado(true);
              setErroEmail(validarEmail(email));
            }}
            placeholder="nome@escola.edu.br"
            aria-invalid={erroEmail ? true : undefined}
            aria-describedby={erroEmail ? "email-recuperacao-erro" : undefined}
            className={`h-12 text-lg ${erroEmail ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {erroEmail && (
            <p
              id="email-recuperacao-erro"
              className="flex items-center gap-1.5 text-sm font-medium text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              {erroEmail}
            </p>
          )}
        </div>

        {erro && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive"
          >
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p className="text-sm">{erro}</p>
          </div>
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
            <Send className="size-5" aria-hidden="true" />
          )}
          {enviando ? "Enviando..." : "Enviar link"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={aoVoltar}
          disabled={enviando}
          className="min-h-11 w-full text-base"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para o login
        </Button>
      </form>

      <div
        role="note"
        className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <HelpCircle className="size-4 text-muted-foreground" aria-hidden="true" />
        </span>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-foreground">Esqueceu o e-mail?</p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com a secretaria da escola para confirmar o e-mail do seu cadastro.
          </p>
          <div className="flex flex-col gap-1 pt-0.5 text-sm sm:flex-row sm:gap-4">
            <a
              href="mailto:secretaria@colegionotus.com.br"
              className="inline-flex items-center gap-1.5 rounded font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Mail className="size-4" aria-hidden="true" />
              secretaria@colegionotus.com.br
            </a>
            <a
              href="tel:+551140028922"
              className="inline-flex items-center gap-1.5 rounded font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Phone className="size-4" aria-hidden="true" />
              (11) 4002-8922
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
