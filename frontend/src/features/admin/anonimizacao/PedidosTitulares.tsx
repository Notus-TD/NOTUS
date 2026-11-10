import { useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Painel, classeCabecalhoTabela } from "@/components/layout/LayoutAdmin";
import { EtiquetaSolicitacao } from "@/features/familia/responsavel/PrivacidadeResponsavel";
import { formatarData, rotuloTipoSolicitacao } from "@/lib/solicitacoes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/api/cliente";
import { getSolicitacoes, responderSolicitacao, type SolicitacaoDTO } from "@/api/privacidade";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";

export function PedidosTitulares() {
  const [versao, setVersao] = useState(0);
  const [aberto, setAberto] = useState<SolicitacaoDTO | null>(null);
  const pedidos = useCarga(getSolicitacoes, versao);
  const emAberto =
    pedidos.estado === "ok" ? pedidos.dados.filter((p) => p.status === "ABERTA") : [];

  return (
    <Painel
      titulo="Pedidos dos titulares"
      icone={FileText}
      semEspaco
      ferramentas={
        pedidos.estado === "ok" ? (
          <span className="text-sm text-muted-foreground">
            {emAberto.length === 0
              ? "Nenhum pedido em aberto"
              : `${emAberto.length} em aberto · prazo de 15 dias`}
          </span>
        ) : undefined
      }
    >
      {pedidos.estado === "carregando" && (
        <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
      )}
      {pedidos.estado === "erro" && (
        <div className="p-4">
          <MensagemErro carga={pedidos} />
        </div>
      )}
      {pedidos.estado === "ok" && pedidos.dados.length === 0 && (
        <p className="p-8 text-center text-sm text-muted-foreground">
          Nenhum pedido recebido. Os responsáveis fazem pedidos de correção ou anonimização pela
          seção "Meus dados" do portal.
        </p>
      )}
      {pedidos.estado === "ok" && pedidos.dados.length > 0 && (
        <Table>
          <TableHeader className={classeCabecalhoTabela}>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Dados de</TableHead>
              <TableHead>Recebido em</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.dados.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{rotuloTipoSolicitacao[p.tipo]}</TableCell>
                <TableCell>{p.solicitanteNome}</TableCell>
                <TableCell>{p.alunoNome ?? "O próprio responsável"}</TableCell>
                <TableCell>{formatarData(p.solicitadaEm)}</TableCell>
                <TableCell>{formatarData(p.prazoEm)}</TableCell>
                <TableCell>
                  <EtiquetaSolicitacao s={p} />
                </TableCell>
                <TableCell className="text-right">
                  {p.status === "ABERTA" ? (
                    <Button size="sm" variant="outline" onClick={() => setAberto(p)}>
                      Responder
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {p.respondidaEm ? formatarData(p.respondidaEm) : "—"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <ResponderPedido
        pedido={aberto}
        aoFechar={() => setAberto(null)}
        aoResponder={() => {
          setAberto(null);
          setVersao((v) => v + 1);
        }}
      />
    </Painel>
  );
}

function ResponderPedido({
  pedido,
  aoFechar,
  aoResponder,
}: {
  pedido: SolicitacaoDTO | null;
  aoFechar: () => void;
  aoResponder: () => void;
}) {
  const [resposta, setResposta] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function responder(status: "ATENDIDA" | "RECUSADA") {
    if (!pedido) return;
    if (status === "RECUSADA" && !resposta.trim()) {
      toast.error("Explique ao responsável o motivo da recusa.");
      return;
    }
    setSalvando(true);
    try {
      await responderSolicitacao(pedido.id, { status, resposta: resposta.trim() || null });
      toast.success(status === "ATENDIDA" ? "Pedido marcado como atendido." : "Pedido recusado.");
      setResposta("");
      aoResponder();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao responder o pedido.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={pedido !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {pedido ? rotuloTipoSolicitacao[pedido.tipo] : ""} ·{" "}
            {pedido?.alunoNome ?? pedido?.solicitanteNome}
          </DialogTitle>
          <DialogDescription>
            Pedido de {pedido?.solicitanteNome}, recebido em{" "}
            {pedido ? formatarData(pedido.solicitadaEm) : ""}. Prazo para responder:{" "}
            {pedido ? formatarData(pedido.prazoEm) : ""}.
          </DialogDescription>
        </DialogHeader>
        {pedido?.detalhe && (
          <p className="whitespace-pre-line rounded-md bg-muted px-3 py-2 text-sm">
            {pedido.detalhe}
          </p>
        )}
        {pedido?.tipo === "ANONIMIZACAO" && (
          <p className="text-sm text-muted-foreground">
            Para atender, cancele a matrícula do aluno e anonimize o cadastro na lista de usuários
            abaixo. Depois marque o pedido como atendido.
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="resposta-pedido">Resposta ao responsável</Label>
          <Textarea
            id="resposta-pedido"
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Obrigatória para recusar."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={salvando} onClick={() => responder("RECUSADA")}>
            Recusar
          </Button>
          <Button disabled={salvando} onClick={() => responder("ATENDIDA")}>
            Marcar como atendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
