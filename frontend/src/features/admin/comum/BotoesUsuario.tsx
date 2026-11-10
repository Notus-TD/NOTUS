import { ApiError } from "@/api/cliente";
import { anonymizeUser, redefinirMfa, reenviarConvite } from "@/api/usuarios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeOff, MailPlus, ShieldOff } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

export function BotaoReenviarConvite({ userId, nome }: { userId: number; nome: string }) {
  const [enviando, setEnviando] = useState(false);

  async function reenviar() {
    setEnviando(true);
    try {
      await reenviarConvite(userId);
      toast.success(`Convite reenviado para ${nome}. O link anterior deixou de valer.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao reenviar o convite.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Button
      variant="outline"

      onClick={() => void reenviar()}
      disabled={enviando}
      aria-busy={enviando}
    >
      <MailPlus className="size-4" aria-hidden="true" />
      {enviando ? "Enviando..." : "Reenviar convite"}
    </Button>
  );
}

export function BotaoRedefinirMfa({ userId, nome }: { userId: number; nome: string }) {
  const [enviando, setEnviando] = useState(false);

  async function redefinir() {
    setEnviando(true);
    try {
      await redefinirMfa(userId);
      toast.success(
        `Verificação de ${nome} redefinida. No próximo login, ${nome} cadastra o celular de novo.`,
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao redefinir a verificação.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="min-h-10 text-sm" disabled={enviando}>
          <ShieldOff className="size-4" aria-hidden="true" />
          Redefinir verificação
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Redefinir a verificação em duas etapas de {nome}?</AlertDialogTitle>
          <AlertDialogDescription>
            Use quando o professor perder ou trocar o celular. O código antigo deixa de valer, e no
            próximo login ele lê um novo QR code no aplicativo autenticador.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={() => void redefinir()}>Redefinir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function BadgeAcessoPendente() {
  return (
    <span
      className="text-sm font-medium text-warning"
      title="Ainda não abriu o link de convite para criar a senha."
    >
      Acesso pendente
    </span>
  );
}

export function BotaoAnonimizar({
  userId,
  nome,
  codigo,
  rotuloCodigo,
  aoConcluir,
  compacto = false,
}: {
  userId: number;
  nome: string;
  codigo: string;
  rotuloCodigo: string;
  aoConcluir?: () => void;
  compacto?: boolean;
}) {
  const [anonimizando, setAnonimizando] = useState(false);
  const [digitado, setDigitado] = useState("");
  const campoId = useId();
  const confere = digitado.trim() === codigo;

  async function confirmar() {
    if (!confere) return;
    setAnonimizando(true);
    try {
      await anonymizeUser(userId, digitado.trim());
      toast.success(`Dados de ${nome} anonimizados.`);
      aoConcluir?.();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao anonimizar os dados do usuário.",
      );
    } finally {
      setAnonimizando(false);
    }
  }

  return (
    <AlertDialog
      onOpenChange={(aberto) => {
        if (!aberto) setDigitado("");
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant={compacto ? "outline" : "destructive"}
          className={
            compacto
              ? "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              : undefined
          }
          disabled={anonimizando}
        >
          <EyeOff className="size-4" aria-hidden="true" />
          {anonimizando ? "Anonimizando..." : "Anonimizar dados"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anonimizar {nome}?</AlertDialogTitle>
          <AlertDialogDescription>
            Nome, e-mail, senha e dados de contato serão apagados permanentemente. Ficam só o
            registro e, no caso de aluno, a matrícula, ligados ao histórico escolar. Isso não pode
            ser desfeito.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <label htmlFor={campoId} className="block text-sm font-medium text-foreground">
            Para confirmar, digite {rotuloCodigo}:{" "}
            <strong className="tabular-nums">{codigo}</strong>
          </label>
          <Input
            id={campoId}
            value={digitado}
            onChange={(e) => setDigitado(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            className="h-9 text-sm"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmar}
            disabled={!confere || anonimizando}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sim, anonimizar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
