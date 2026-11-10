import { ApiError } from "@/api/cliente";
import { redefinirMfa, reenviarConvite } from "@/api/usuarios";
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
import { MailPlus, ShieldOff } from "lucide-react";
import { useState } from "react";
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
