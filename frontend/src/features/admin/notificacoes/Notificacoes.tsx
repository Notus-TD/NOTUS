import { ApiError } from "@/api/cliente";
import {
  getNotificacoes,
  reenviarNotificacao,
  type NotificacaoDTO,
  type StatusNotificacao,
  type TipoNotificacao,
} from "@/api/notificacoes";
import { Painel } from "@/components/layout/LayoutAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { RefreshCw, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const rotuloTipoNotificacao: Record<TipoNotificacao, string> = {
  FALTA: "Falta",
  ATIVIDADE: "Atividade",
  NOTA_FINAL: "Nota final",
  COMUNICADO: "Comunicado",
};

const rotuloStatusNotificacao: Record<StatusNotificacao, string> = {
  PENDENTE: "Pendente",
  ENVIANDO: "Enviando",
  ENVIADA: "Enviada",
  ENTREGUE: "Entregue",
  LIDA: "Lida",
  FALHA: "Falha",
  CANCELADA: "Cancelada",
};

const variantePorStatus: Record<
  StatusNotificacao,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDENTE: "secondary",
  ENVIANDO: "secondary",
  ENVIADA: "default",
  ENTREGUE: "default",
  LIDA: "default",
  FALHA: "destructive",
  CANCELADA: "outline",
};

export function Notificacoes() {
  const [versao, setVersao] = useState(0);
  const [filtroTipo, setFiltroTipo] = useState<TipoNotificacao | "TODOS">("TODOS");
  const [filtroStatus, setFiltroStatus] = useState<StatusNotificacao | "TODOS">("TODOS");
  const [reenviando, setReenviando] = useState<number | null>(null);
  const carga = useCarga<NotificacaoDTO[]>(
    () =>
      getNotificacoes({
        tipo: filtroTipo === "TODOS" ? undefined : filtroTipo,
        status: filtroStatus === "TODOS" ? undefined : filtroStatus,
      }),
    versao,
  );

  async function reenviar(id: number) {
    setReenviando(id);
    try {
      await reenviarNotificacao(id);
      toast.success("Notificação recolocada na fila de envio.");
      setVersao((v) => v + 1);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao reenviar a notificação.");
    } finally {
      setReenviando(null);
    }
  }

  return (
    <div className="space-y-6">
      <Painel>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-48">
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Tipo</label>
            <Select
              value={filtroTipo}
              onValueChange={(v) => {
                setFiltroTipo(v as TipoNotificacao | "TODOS");
                setVersao((n) => n + 1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                {(Object.keys(rotuloTipoNotificacao) as TipoNotificacao[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {rotuloTipoNotificacao[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-48">
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Situação</label>
            <Select
              value={filtroStatus}
              onValueChange={(v) => {
                setFiltroStatus(v as StatusNotificacao | "TODOS");
                setVersao((n) => n + 1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas</SelectItem>
                {(Object.keys(rotuloStatusNotificacao) as StatusNotificacao[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {rotuloStatusNotificacao[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setVersao((v) => v + 1)}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Atualizar
          </Button>
        </div>
      </Painel>

      {carga.estado === "carregando" && (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      )}
      {carga.estado === "erro" && <MensagemErro carga={carga} />}
      {carga.estado === "ok" && carga.dados.length === 0 && (
        <Painel>
          <p className="text-sm text-muted-foreground">Nenhuma notificação encontrada.</p>
        </Painel>
      )}
      {carga.estado === "ok" && carga.dados.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground [&_th]:font-semibold">
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Responsável</th>
                <th className="px-4 py-3 font-medium">Aluno</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 font-medium">Tentativas</th>
                <th className="px-4 py-3 font-medium">Criada em</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {carga.dados.map((n) => (
                <tr key={n.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{rotuloTipoNotificacao[n.tipo]}</td>
                  <td className="px-4 py-3 text-foreground">{n.responsavelNome}</td>
                  <td className="px-4 py-3 text-foreground">{n.studentNome ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={variantePorStatus[n.status]}>
                      {rotuloStatusNotificacao[n.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground">{n.tentativas}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(n.criadoEm).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {n.status === "FALHA" && (
                      <Button
                        variant="outline"
                        className="min-h-9 text-sm"
                        disabled={reenviando === n.id}
                        onClick={() => reenviar(n.id)}
                      >
                        <Send className="size-4" aria-hidden="true" />
                        Reenviar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
