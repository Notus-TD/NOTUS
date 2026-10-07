import { useState, type FormEvent } from "react";
import { AlertCircle, ArrowLeft, Loader2, Send } from "lucide-react";
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
    </div>
  );
}
