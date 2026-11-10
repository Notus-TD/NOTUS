import { History } from "lucide-react";
import { getHistoricoAnonimizacoes } from "@/api/privacidade";
import { Painel, classeCabecalhoTabela } from "@/components/layout/LayoutAdmin";
import { MensagemErro } from "@/components/layout/MensagemErro";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCarga } from "@/hooks/use-carga";
import { formatarDataHora } from "@/lib/solicitacoes";

export function HistoricoAnonimizacoes({ versao }: { versao: number }) {
  const carga = useCarga(getHistoricoAnonimizacoes, versao);
  return (
    <Painel titulo="Histórico de anonimizações" icone={History} semEspaco>
      {carga.estado === "carregando" && (
        <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
      )}
      {carga.estado === "erro" && (
        <div className="p-4">
          <MensagemErro carga={carga} />
        </div>
      )}
      {carga.estado === "ok" && carga.dados.length === 0 && (
        <p className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma anonimização feita até agora.
        </p>
      )}
      {carga.estado === "ok" && carga.dados.length > 0 && (
        <Table>
          <TableHeader className={classeCabecalhoTabela}>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Titular</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Pedido</TableHead>
              <TableHead>Executada por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carga.dados.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">
                  {formatarDataHora(r.executadoEm)}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{r.perfil === "ALUNO" ? "Aluno" : "Responsável"}</p>
                  <p className="text-xs text-muted-foreground">
                    Registro {r.usuarioId}
                    {r.matricula ? ` · matrícula ${r.matricula}` : ""}
                  </p>
                </TableCell>
                <TableCell>
                  <p>{r.motivoDescricao}</p>
                  {r.detalhe && <p className="text-xs text-muted-foreground">{r.detalhe}</p>}
                </TableCell>
                <TableCell>{r.solicitacaoId ? `nº ${r.solicitacaoId}` : "—"}</TableCell>
                <TableCell className="text-sm">{r.executadoPor}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Painel>
  );
}
