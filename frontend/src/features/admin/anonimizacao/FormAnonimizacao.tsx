import { useId, useState } from "react";
import { EyeOff } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/cliente";
import { anonimizarUsuario, type MotivoAnonimizacao } from "@/api/privacidade";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MOTIVOS_ANONIMIZACAO } from "@/lib/anonimizacao";

// "Pedido do titular" e "Outro motivo" exigem detalhe: o pedido chega pela secretaria (fluxo manual),
// então o admin registra como e quando ele foi feito.
const exigeDetalhe = (m: MotivoAnonimizacao) => m === "OUTRO" || m === "PEDIDO_DO_TITULAR";

export function FormAnonimizacao({
  userId,
  nome,
  codigo,
  rotuloCodigo,
  aoConcluir,
}: {
  userId: number;
  nome: string;
  codigo: string;
  rotuloCodigo: string;
  aoConcluir: () => void;
}) {
  const id = useId();
  const [motivo, setMotivo] = useState<MotivoAnonimizacao>("PEDIDO_DO_TITULAR");
  const [detalhe, setDetalhe] = useState("");
  const [digitado, setDigitado] = useState("");
  const [salvando, setSalvando] = useState(false);

  const faltaDetalhe = exigeDetalhe(motivo) && !detalhe.trim();
  const confere = digitado.trim() === codigo;
  const podeConfirmar = confere && !faltaDetalhe && !salvando;

  async function anonimizar() {
    if (!podeConfirmar) return;
    setSalvando(true);
    try {
      await anonimizarUsuario(userId, {
        confirmacao: digitado.trim(),
        motivo,
        detalhe: detalhe.trim() || null,
      });
      toast.success(`Dados de ${nome} anonimizados. O motivo ficou registrado.`);
      aoConcluir();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao anonimizar os dados.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-motivo`}>Motivo</Label>
        <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoAnonimizacao)}>
          <SelectTrigger id={`${id}-motivo`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOTIVOS_ANONIMIZACAO.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor={`${id}-detalhe`}>
          Detalhes {exigeDetalhe(motivo) ? "(obrigatório)" : "(opcional)"}
        </Label>
        <Textarea
          id={`${id}-detalhe`}
          value={detalhe}
          onChange={(e) => setDetalhe(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Ex.: pedido feito pela mãe na secretaria em 10/11/2026, por escrito."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-confirmacao`}>
          Para confirmar, digite {rotuloCodigo}: <strong className="tabular-nums">{codigo}</strong>
        </Label>
        <Input
          id={`${id}-confirmacao`}
          value={digitado}
          onChange={(e) => setDigitado(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>
      <div className="flex items-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={!podeConfirmar}>
              <EyeOff aria-hidden="true" />
              {salvando ? "Anonimizando..." : "Anonimizar dados"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Anonimizar {nome}?</AlertDialogTitle>
              <AlertDialogDescription>
                Nome, e-mail, senha e dados de contato serão apagados permanentemente. O histórico
                escolar fica guardado sem identificação. Isso não pode ser desfeito.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={anonimizar}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sim, anonimizar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
