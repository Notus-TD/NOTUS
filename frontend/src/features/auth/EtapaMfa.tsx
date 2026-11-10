import { useEffect, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  confirmarCadastroMfa,
  iniciarCadastroMfa,
  verificarMfa,
  type MfaCadastroDTO,
} from "@/api/auth";
import { ApiError } from "@/api/cliente";
import type { Session } from "@/lib/sessao";

export function EtapaMfa({
  etapa,
  email,
  desafio,
  aoConcluir,
  aoVoltar,
}: {
  etapa: "MFA" | "MFA_CADASTRO";
  email: string;
  desafio: string;
  aoConcluir: (session: Session) => void;
  aoVoltar: () => void;
}) {
  const [cadastro, setCadastro] = useState<MfaCadastroDTO | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (etapa !== "MFA_CADASTRO") return;
    let ativo = true;
    iniciarCadastroMfa(desafio)
      .then(async (dados) => {
        if (!ativo) return;
        setCadastro(dados);
        const imagem = await QRCode.toDataURL(dados.uri, { margin: 1, width: 220 });
        if (ativo) setQr(imagem);
      })
      .catch(
        (e) =>
          ativo &&
          setErro(e instanceof ApiError ? e.message : "Não foi possível iniciar a verificação."),
      );
    return () => {
      ativo = false;
    };
  }, [etapa, desafio]);

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo)) {
      setErro("Digite os 6 números do aplicativo.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const resultado =
        etapa === "MFA"
          ? await verificarMfa(desafio, codigo)
          : await confirmarCadastroMfa(desafio, codigo);
      if (resultado.etapa === "CONCLUIDO") aoConcluir(resultado.session);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao verificar o código.");
      setCodigo("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
        {etapa === "MFA" ? "Verificação em duas etapas" : "Ative a verificação em duas etapas"}
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        {etapa === "MFA"
          ? `Abra o aplicativo autenticador e digite o código da conta NOTUS (${email}).`
          : "Para proteger os dados dos alunos, administradores e professores entram com a senha e um código do celular."}
      </p>

      {etapa === "MFA_CADASTRO" && (
        <ol className="mt-6 space-y-4 text-sm text-foreground">
          <li>
            <span className="font-semibold">1.</span> Instale o Google Authenticator ou o Microsoft
            Authenticator no celular.
          </li>
          <li>
            <span className="font-semibold">2.</span> No aplicativo, adicione uma conta e leia o QR
            code:
            <div className="mt-3 flex justify-center rounded-md border border-border bg-white p-3">
              {qr ? (
                <img
                  src={qr}
                  alt="QR code para cadastrar o NOTUS no aplicativo autenticador"
                  width={220}
                  height={220}
                />
              ) : (
                <Loader2
                  className="my-20 size-6 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </div>
            {cadastro && (
              <p className="mt-2 text-xs text-muted-foreground">
                Sem câmera? Digite esta chave no aplicativo:{" "}
                <span className="break-all font-mono text-foreground">
                  {cadastro.segredo.match(/.{1,4}/g)?.join(" ")}
                </span>
              </p>
            )}
          </li>
          <li>
            <span className="font-semibold">3.</span> Digite abaixo o código de 6 números que
            aparece no aplicativo.
          </li>
        </ol>
      )}

      <form onSubmit={confirmar} className="mt-6 space-y-4" noValidate>
        <div className="space-y-2">
          <label htmlFor="codigo-mfa" className="block text-base font-semibold text-foreground">
            Código do aplicativo
          </label>
          <Input
            id="codigo-mfa"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? "codigo-mfa-erro" : undefined}
            className="h-12 text-center font-mono text-2xl tracking-[0.5em]"
          />
          {erro && (
            <p id="codigo-mfa-erro" role="alert" className="text-sm font-medium text-destructive">
              {erro}
            </p>
          )}
        </div>
        <Button
          type="submit"
          disabled={enviando || (etapa === "MFA_CADASTRO" && !cadastro)}
          className="min-h-11 w-full text-base"
        >
          {enviando ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck className="size-5" aria-hidden="true" />
          )}
          {etapa === "MFA" ? "Verificar e entrar" : "Ativar e entrar"}
        </Button>
        <button
          type="button"
          onClick={aoVoltar}
          className="w-full rounded text-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Voltar para o login
        </button>
      </form>
    </div>
  );
}
