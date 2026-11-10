import { useId, useState } from "react";
import { EyeOff } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/cliente";
import { anonimizarUsuario, type MotivoAnonimizacao, type SolicitacaoDTO } from "@/api/privacidade";
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
import { MOTIVOS_ANONIMIZACAO, formatarData } from "@/lib/solicitacoes";

export function FormAnonimizacao({
  userId,
  nome,
  codigo,
  rotuloCodigo,
  pedidos,
  aoConcluir,
}: {
  userId: number;
  nome: string;
  codigo: string;
  rotuloCodigo: string;
  pedidos: SolicitacaoDTO[];
  aoConcluir: () => void;
}) {
  const id = useId();
  const pedidosAnonimizacao = pedidos.filter((p) => p.tipo === "ANONIMIZACAO");
  const [motivo, setMotivo] = useState<MotivoAnonimizacao>(
    pedidosAnonimizacao.length > 0 ? "PEDIDO_DO_TITULAR" : "FIM_DO_PRAZO_DE_GUARDA",
  );
  const [pedidoId, setPedidoId] = useState(
    pedidosAnonimizacao[0] ? String(pedidosAnonimizacao[0].id) : "",
  );
  const [detalhe, setDetalhe] = useState("");
  const [digitado, setDigitado] = useState("");
  const [salvando, setSalvando] = useState(false);

  const motivos = MOTIVOS_ANONIMIZACAO.filter(
    (m) => m.id !== "PEDIDO_DO_TITULAR" || pedidosAnonimizacao.length > 0,
  );
  const faltaDetalhe = motivo === "OUTRO" && !detalhe.trim();
  const faltaPedido = motivo === "PEDIDO_DO_TITULAR" && !pedidoId;
  const confere = digitado.trim() === codigo;
  const podeConfirmar = confere && !faltaDetalhe && !faltaPedido && !salvando;

  async function anonimizar() {
    if (!podeConfirmar) return;
    setSalvando(true);
    try {
      await anonimizarUsuario(userId, {
        confirmacao: digitado.trim(),
        motivo,
        detalhe: detalhe.trim() || null,
        solicitacaoId: motivo === "PEDIDO_DO_TITULAR" ? Number(pedidoId) : null,
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
            {motivos.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {motivo === "PEDIDO_DO_TITULAR" && (
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-pedido`}>Pedido atendido</Label>
          <Select value={pedidoId} onValueChange={setPedidoId}>
            <SelectTrigger id={`${id}-pedido`}>
              <SelectValue placeholder="Escolha o pedido" />
            </SelectTrigger>
            <SelectContent>
              {pedidosAnonimizacao.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  Pedido nº {p.id} de {p.solicitanteNome}, em {formatarData(p.solicitadaEm)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor={`${id}-detalhe`}>
          Detalhes {motivo === "OUTRO" ? "(obrigatório)" : "(opcional)"}
        </Label>
        <Textarea
          id={`${id}-detalhe`}
          value={detalhe}
          onChange={(e) => setDetalhe(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Ex.: aluno transferido em 2026, pedido feito pela mãe na secretaria."
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
