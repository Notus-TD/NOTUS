import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, KeyRound, Loader2, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsReaderDialog } from "@/components/TermsReaderDialog";
import { RodapeSite } from "@/components/LegalPage";
import {
  ApiError,
  LINK_INVALIDO,
  definirSenha,
  validarTokenSenha,
  type TipoTokenSenha,
} from "@/lib/api";
import { clearSession } from "@/lib/auth";
import { MarcaNotus } from "@/components/AppShell";

export const Route = createFileRoute("/redefinir-senha")({
  validateSearch: (search: Record<string, unknown>): { token?: string } =>
    typeof search["token"] === "string" && search["token"] ? { token: search["token"] } : {},
  head: () => ({
    meta: [
      { title: "Definir senha · NOTUS" },
      // O token está na URL: não deixa ele vazar para outros sites pelo cabeçalho Referer.
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: RedefinirSenhaPage,
});

type Estado =
  | { fase: "verificando" }
  | { fase: "invalido"; mensagem: string }
  | { fase: "pronto"; tipo: TipoTokenSenha; emailMascarado: string };

function RedefinirSenhaPage() {
  const { token } = Route.useSearch();
  const [estado, setEstado] = useState<Estado>({ fase: "verificando" });

  useEffect(() => {
    if (!token) {
      setEstado({ fase: "invalido", mensagem: "Este link está incompleto. Peça um novo link." });
      return;
    }
    let ativo = true;
    validarTokenSenha(token)
      .then((dto) => {
        if (ativo)
          setEstado({ fase: "pronto", tipo: dto.tipo, emailMascarado: dto.emailMascarado });
      })
      .catch((err) => {
        if (!ativo) return;
        setEstado({
          fase: "invalido",
          mensagem: err instanceof ApiError ? err.message : "Erro inesperado ao verificar o link.",
        });
      });
    return () => {
      ativo = false;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-4 sm:px-6">
          <MarcaNotus />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm">
          {estado.fase === "verificando" && (
            <p
              role="status"
              className="flex items-center justify-center gap-2 text-base text-muted-foreground"
            >
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Verificando o link...
            </p>
          )}
          {estado.fase === "invalido" && <LinkInvalido mensagem={estado.mensagem} />}
          {estado.fase === "pronto" && token && (
            <FormularioSenha
              token={token}
              tipo={estado.tipo}
              emailMascarado={estado.emailMascarado}
              aoExpirar={(mensagem) => setEstado({ fase: "invalido", mensagem })}
            />
          )}
        </div>
      </main>

      <RodapeSite novaAba />
    </div>
  );
}

function LinkInvalido({ mensagem }: { mensagem: string }) {
  const navigate = useNavigate();
  return (
    <div className="text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-7 text-destructive" aria-hidden="true" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
        Link indisponível
      </h1>
      <p className="mt-3 text-base text-muted-foreground" role="alert">
        {mensagem}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Os links valem por pouco tempo e só podem ser usados uma vez.
      </p>
      <div className="mt-6 space-y-2">
        <Button
          type="button"
          onClick={() => navigate({ to: "/login", search: { recuperar: true }, replace: true })}
          className="min-h-12 w-full text-lg"
        >
          <Send className="size-5" aria-hidden="true" />
          Pedir novo link
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate({ to: "/login", replace: true })}
          className="min-h-11 w-full text-base"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para o login
        </Button>
      </div>
    </div>
  );
}

function FormularioSenha({
  token,
  tipo,
  emailMascarado,
  aoExpirar,
}: {
  token: string;
  tipo: TipoTokenSenha;
  emailMascarado: string;
  aoExpirar: (mensagem: string) => void;
}) {
  const navigate = useNavigate();
  const ehConvite = tipo === "CONVITE";
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [termosLidos, setTermosLidos] = useState(false);
  const [politicaLida, setPoliticaLida] = useState(false);
  const documentosLidos = termosLidos && politicaLida;
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: FormEvent) {
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
    if (ehConvite && !documentosLidos) {
      setErro("Abra e leia os termos de uso e a política de privacidade antes de continuar.");
      return;
    }
    if (ehConvite && !aceitouTermos) {
      setErro("É preciso aceitar os termos para continuar.");
      return;
    }

    setEnviando(true);
    try {
      await definirSenha(token, novaSenha, ehConvite && aceitouTermos);
      // Uma sessão antiga no navegador não deve continuar valendo depois da troca de senha.
      clearSession();
      toast.success(
        ehConvite
          ? "Acesso ativado. Entre com a senha nova."
          : "Senha alterada. Entre com a senha nova.",
      );
      navigate({ to: "/login", replace: true });
    } catch (err) {
      const mensagem = err instanceof ApiError ? err.message : "Erro inesperado ao salvar a senha.";
      // O link pode ter expirado ou sido usado em outra aba enquanto a pessoa digitava.
      if (mensagem === LINK_INVALIDO) {
        aoExpirar(mensagem);
        return;
      }
      setErro(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  const Icone = ehConvite ? ShieldCheck : KeyRound;

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icone className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {ehConvite ? "Ative seu acesso" : "Criar senha nova"}
          </h1>
          <p className="text-base text-muted-foreground">
            Conta <strong className="break-all text-foreground">{emailMascarado}</strong>
          </p>
        </div>
      </div>

      <form onSubmit={salvar} className="mt-8 space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="nova-senha" className="block text-lg font-semibold text-foreground">
            Nova senha
          </label>
          <Input
            id="nova-senha"
            type="password"
            autoComplete="new-password"
            autoFocus
            required
            minLength={8}
            disabled={enviando}
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="h-12 text-lg"
          />
          <p className="text-sm text-muted-foreground">Mínimo de 8 caracteres.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmar-senha" className="block text-lg font-semibold text-foreground">
            Confirmar nova senha
          </label>
          <Input
            id="confirmar-senha"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={enviando}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className="h-12 text-lg"
          />
        </div>

        {ehConvite && (
          <>
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-base font-semibold text-foreground">Termos de uso e privacidade</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Antes de continuar, leia os Termos de Uso, com as regras do portal, e a Política de
                Privacidade, que explica como a escola trata os dados acadêmicos e de contato
                conforme a Lei Geral de Proteção de Dados (LGPD).
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  <TermsReaderDialog documento="termos" onConfirm={() => setTermosLidos(true)} />
                  {termosLidos && <span className="ml-2 font-medium text-success">✓ Lidos</span>}
                </li>
                <li>
                  <TermsReaderDialog
                    documento="privacidade"
                    onConfirm={() => setPoliticaLida(true)}
                  />
                  {politicaLida && <span className="ml-2 font-medium text-success">✓ Lida</span>}
                </li>
              </ul>
              <p className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                <strong>Se você é responsável:</strong> ao aceitar, você consente, como responsável
                legal, com o tratamento dos dados dos alunos menores vinculados a você (Art. 14 da
                LGPD). Você pode retirar esse consentimento a qualquer momento pela secretaria.
              </p>
            </div>

            <label
              className={`flex items-start gap-3 ${!documentosLidos ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <Checkbox
                checked={aceitouTermos}
                disabled={!documentosLidos || enviando}
                onCheckedChange={(v) => setAceitouTermos(v === true)}
                className="mt-1"
              />
              <span className="text-base text-foreground">
                {documentosLidos
                  ? "Li e aceito os termos de uso e a política de privacidade."
                  : "Abra e leia os dois documentos acima para liberar esta opção."}
              </span>
            </label>
          </>
        )}

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
          disabled={enviando || !novaSenha || !confirmarSenha || (ehConvite && !aceitouTermos)}
          aria-busy={enviando}
          className="min-h-12 w-full text-lg"
        >
          {enviando && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          {enviando ? "Salvando..." : ehConvite ? "Ativar acesso" : "Salvar senha"}
        </Button>
      </form>
    </>
  );
}
