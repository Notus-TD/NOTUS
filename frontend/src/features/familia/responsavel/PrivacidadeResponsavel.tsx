import { useState, type FormEvent } from "react";
import { Download, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Etiqueta, Painel, classeCabecalhoTabela } from "@/components/layout/LayoutAdmin";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type StudentMinDTO } from "@/api/alunos";
import { ApiError } from "@/api/cliente";
import {
  getMeusDados,
  getMinhasSolicitacoes,
  solicitarPedidoTitular,
  type SolicitacaoDTO,
  type TipoSolicitacao,
} from "@/api/privacidade";
import { hojeLocal } from "@/lib/datas";
import { formatarData, rotuloTipoSolicitacao } from "@/lib/solicitacoes";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";

export function EtiquetaSolicitacao({ s }: { s: SolicitacaoDTO }) {
  if (s.atrasada) return <Etiqueta tom="perigo">Prazo vencido</Etiqueta>;
  if (s.status === "ABERTA") return <Etiqueta tom="alerta">Em análise</Etiqueta>;
  if (s.status === "ATENDIDA") return <Etiqueta tom="sucesso">Atendido</Etiqueta>;
  return <Etiqueta tom="neutro">Recusado</Etiqueta>;
}

const PROPRIO = "proprio";

export function PrivacidadeResponsavel({ filhos }: { filhos: StudentMinDTO[] }) {
  const [versao, setVersao] = useState(0);
  const [baixando, setBaixando] = useState(false);
  const [tipo, setTipo] = useState<TipoSolicitacao>("CORRECAO");
  const [titular, setTitular] = useState(PROPRIO);
  const [detalhe, setDetalhe] = useState("");
  const [enviando, setEnviando] = useState(false);
  const pedidos = useCarga(getMinhasSolicitacoes, versao);

  async function baixar() {
    setBaixando(true);
    try {
      const dados = await getMeusDados();
      const arquivo = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");
      link.href = url;
      link.download = `notus-meus-dados-${hojeLocal()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao gerar a cópia dos dados.");
    } finally {
      setBaixando(false);
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (tipo === "CORRECAO" && !detalhe.trim()) {
      toast.error("Conte o que precisa ser corrigido.");
      return;
    }
    setEnviando(true);
    try {
      await solicitarPedidoTitular({
        tipo,
        alunoId: titular === PROPRIO ? null : Number(titular),
        detalhe: detalhe.trim() || null,
      });
      toast.success("Pedido enviado. A secretaria responde em até 15 dias.");
      setDetalhe("");
      setVersao((v) => v + 1);
    } catch (erro) {
      toast.error(erro instanceof ApiError ? erro.message : "Erro ao enviar o pedido.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      <Painel titulo="Cópia dos seus dados" icone={Download}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-prose text-sm text-muted-foreground">
            Baixe um arquivo com tudo o que o NOTUS guarda sobre você e seus filhos: cadastro,
            boletim, faltas, atividades, avisos e pedidos. O arquivo segue o formato JSON e pode ser
            aberto em qualquer editor de texto.
          </p>
          <Button onClick={baixar} disabled={baixando}>
            <Download aria-hidden="true" />
            {baixando ? "Gerando..." : "Baixar meus dados"}
          </Button>
        </div>
      </Painel>

      <Painel titulo="Fazer um pedido à secretaria" icone={ShieldCheck}>
        <form onSubmit={enviar} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pedido-tipo">Pedido</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoSolicitacao)}>
              <SelectTrigger id="pedido-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CORRECAO">Correção de dados</SelectItem>
                <SelectItem value="ANONIMIZACAO">Anonimização dos dados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pedido-titular">Dados de</Label>
            <Select value={titular} onValueChange={setTitular}>
              <SelectTrigger id="pedido-titular">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROPRIO}>Meus dados (responsável)</SelectItem>
                {filhos.map((f) => (
                  <SelectItem key={f.userId} value={String(f.userId)}>
                    {f.studentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="pedido-detalhe">
              Detalhes {tipo === "ANONIMIZACAO" ? "(opcional)" : ""}
            </Label>
            <Textarea
              id="pedido-detalhe"
              value={detalhe}
              onChange={(e) => setDetalhe(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={
                tipo === "CORRECAO"
                  ? "Ex.: o telefone cadastrado está errado, o certo é (11) 98888-7777."
                  : "Ex.: meu filho saiu da escola."
              }
            />
          </div>
          {tipo === "ANONIMIZACAO" && (
            <p className="text-sm text-muted-foreground md:col-span-2">
              A anonimização é feita depois do fim da matrícula. Registros escolares que a lei manda
              guardar, como notas e frequência, são mantidos sem o nome do aluno.
            </p>
          )}
          <div className="md:col-span-2">
            <Button type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar pedido"}
            </Button>
          </div>
        </form>
      </Painel>

      <Painel titulo="Seus pedidos" icone={FileText} semEspaco>
        {pedidos.estado === "carregando" && (
          <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
        )}
        {pedidos.estado === "erro" && (
          <div className="p-4">
            <MensagemErro carga={pedidos} />
          </div>
        )}
        {pedidos.estado === "ok" && pedidos.dados.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Nenhum pedido feito até agora.
          </p>
        )}
        {pedidos.estado === "ok" && pedidos.dados.length > 0 && (
          <Table>
            <TableHeader className={classeCabecalhoTabela}>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Dados de</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Resposta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.dados.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{rotuloTipoSolicitacao[s.tipo]}</TableCell>
                  <TableCell>{s.alunoNome ?? "Você"}</TableCell>
                  <TableCell>{formatarData(s.solicitadaEm)}</TableCell>
                  <TableCell>{formatarData(s.prazoEm)}</TableCell>
                  <TableCell>
                    <EtiquetaSolicitacao s={s} />
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-normal text-sm text-muted-foreground">
                    {s.resposta ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Painel>
    </div>
  );
}
