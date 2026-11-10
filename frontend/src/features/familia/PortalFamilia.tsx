import type { LucideIcon } from "lucide-react";
import { BarChart3, CalendarClock, ClipboardList, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Etiqueta, Painel, classeCabecalhoTabela } from "@/components/layout/LayoutAdmin";
import type { AtividadeDTO } from "@/api/atividades";
import type { Bimestre, BoletimDisciplinaDTO } from "@/api/boletim";
import type { FrequenciaDTO } from "@/api/falta";
import {
  paraAtividadeAluno,
  type AtividadeAluno,
  type Situacao,
} from "@/features/familia/atividades-aluno";
import { getCalendario } from "@/api/calendario";
import { useCarga } from "@/hooks/use-carga";
import { bimestreAtual, nomeBimestre } from "@/lib/bimestres";
import { formatarData } from "@/lib/datas";
import { cn } from "@/lib/utils";

const PRESENCA_MINIMA = 75;
const PRESENCA_ATENCAO = 85;

type Tom = "sucesso" | "alerta" | "perigo" | "neutro";

export type DestinoResumo = "notas" | "atividades" | "avisos";

function situacaoPresenca(percentual: number): { rotulo: string; tom: Tom; barra: string } {
  if (percentual >= PRESENCA_ATENCAO)
    return { rotulo: "Regular", tom: "sucesso", barra: "bg-success" };
  if (percentual >= PRESENCA_MINIMA)
    return { rotulo: "Atenção", tom: "alerta", barra: "bg-warning" };
  return { rotulo: "Abaixo do mínimo", tom: "perigo", barra: "bg-destructive" };
}

function presencaGeral(frequencia: FrequenciaDTO[]) {
  const aulas = frequencia.reduce((soma, f) => soma + f.totalAulas, 0);
  const faltas = frequencia.reduce((soma, f) => soma + f.totalFaltas, 0);
  return aulas > 0 ? Math.round((Math.max(0, aulas - faltas) / aulas) * 100) : null;
}

function mediaGeral(boletim: BoletimDisciplinaDTO[]) {
  const medias = boletim.map((d) => d.mediaFinal).filter((m): m is number => m !== null);
  return medias.length === 0 ? null : medias.reduce((soma, m) => soma + m, 0) / medias.length;
}

function formatarNota(valor: number | null) {
  return valor === null ? "—" : valor.toFixed(1).replace(".", ",");
}

const situacaoAtividade: Record<Situacao, { texto: string; tom: Tom; ordem: number }> = {
  atrasada: { texto: "Atrasada", tom: "perigo", ordem: 0 },
  hoje: { texto: "Entregar hoje", tom: "alerta", ordem: 1 },
  proxima: { texto: "Para entregar", tom: "neutro", ordem: 2 },
  entregue: { texto: "Entregue", tom: "sucesso", ordem: 3 },
};

const ORDEM_PROXIMAS: Record<Situacao, number> = { hoje: 0, proxima: 1, atrasada: 2, entregue: 3 };

function ordenarProximas(itens: AtividadeAluno[]) {
  return [...itens].sort(
    (a, b) =>
      ORDEM_PROXIMAS[a.situacao] - ORDEM_PROXIMAS[b.situacao] ||
      a.prazoData.localeCompare(b.prazoData),
  );
}

function ordenarAtividades(itens: AtividadeAluno[]) {
  return [...itens].sort(
    (a, b) =>
      situacaoAtividade[a.situacao].ordem - situacaoAtividade[b.situacao].ordem ||
      a.prazoData.localeCompare(b.prazoData),
  );
}

function Indicador({
  icone: Icone,
  rotulo,
  valor,
  detalhe,
  destaque,
}: {
  icone: LucideIcon;
  rotulo: string;
  valor: string;
  detalhe?: string | undefined;
  destaque?: Tom | undefined;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-card p-4 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icone className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{rotulo}</p>
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums text-foreground",
            destaque === "perigo" && "text-destructive",
            destaque === "alerta" && "text-warning",
          )}
        >
          {valor}
        </p>
        {detalhe && <p className="text-xs text-muted-foreground">{detalhe}</p>}
      </div>
    </div>
  );
}

export function TabelaAtividades({
  atividades,
  hoje,
}: {
  atividades: AtividadeDTO[];
  hoje: string;
}) {
  const itens = ordenarAtividades(atividades.map((a) => paraAtividadeAluno(a, hoje)));
  return (
    <Table>
      <TableHeader className={classeCabecalhoTabela}>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">Atividade</TableHead>
          <TableHead>Disciplina</TableHead>
          <TableHead>Prazo</TableHead>
          <TableHead className="text-right">Pontos</TableHead>
          <TableHead className="pr-4">Situação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {itens.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="max-w-md py-3 pl-4">
              <span className="block font-medium text-foreground">{a.titulo}</span>
              <span className="block truncate text-xs text-muted-foreground">{a.descricao}</span>
            </TableCell>
            <TableCell className="whitespace-nowrap">{a.disciplina}</TableCell>
            <TableCell className="whitespace-nowrap tabular-nums">
              {formatarData(a.prazoData)}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatarNota(a.pontos)}</TableCell>
            <TableCell className="pr-4">
              <Etiqueta tom={situacaoAtividade[a.situacao].tom}>
                {situacaoAtividade[a.situacao].texto}
              </Etiqueta>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ResumoAluno({
  boletim,
  frequencia,
  atividades,
  hoje,
  avisosNovos,
  aoAbrir,
}: {
  boletim: BoletimDisciplinaDTO[] | null;
  frequencia: FrequenciaDTO[] | null;
  atividades: AtividadeDTO[] | null;
  hoje: string;
  avisosNovos?: number | undefined;
  aoAbrir: (destino: DestinoResumo) => void;
}) {
  const media = boletim ? mediaGeral(boletim) : null;
  const presenca = frequencia ? presencaGeral(frequencia) : null;
  const calendario = useCarga(() => getCalendario(hoje.slice(0, 4)), 0);
  const bimestre: Bimestre =
    (calendario.estado === "ok" ? calendario.dados.bimestreAtual : null) ??
    bimestreAtual(new Date(`${hoje}T12:00:00`));
  const itens = atividades ? atividades.map((a) => paraAtividadeAluno(a, hoje)) : null;
  const doBimestre = atividades
    ? atividades.filter((a) => a.bimestre === bimestre).map((a) => paraAtividadeAluno(a, hoje))
    : null;
  const pendentes = doBimestre
    ? ordenarProximas(doBimestre.filter((a) => a.situacao !== "entregue"))
    : null;
  const atrasadas = doBimestre ? doBimestre.filter((a) => a.situacao === "atrasada").length : 0;
  const entregues = itens ? itens.filter((a) => a.situacao === "entregue").length : 0;

  const disciplinas = new Map<
    number,
    { nome: string; media: number | null; presenca: number | null }
  >();
  for (const d of boletim ?? []) {
    disciplinas.set(d.disciplinaId, {
      nome: d.disciplinaTitle,
      media: d.mediaFinal,
      presenca: null,
    });
  }
  for (const f of frequencia ?? []) {
    const atual = disciplinas.get(f.disciplinaId);
    disciplinas.set(f.disciplinaId, {
      nome: f.disciplinaTitle,
      media: atual?.media ?? null,
      presenca: Math.round(f.percentualPresenca),
    });
  }
  const linhas = [...disciplinas.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          icone={BarChart3}
          rotulo="Média geral"
          valor={boletim ? formatarNota(media) : "…"}
          detalhe="Média das disciplinas no ano"
          destaque={media !== null && media < 6 ? "perigo" : undefined}
        />
        <Indicador
          icone={UserCheck}
          rotulo="Presença"
          valor={frequencia ? (presenca === null ? "—" : `${presenca}%`) : "…"}
          detalhe={`Mínimo de ${PRESENCA_MINIMA}%`}
          destaque={presenca === null ? undefined : situacaoPresenca(presenca).tom}
        />
        <Indicador
          icone={ClipboardList}
          rotulo="Atividades pendentes"
          valor={pendentes ? String(pendentes.length) : "…"}
          detalhe={`${nomeBimestre(bimestre)}${atrasadas > 0 ? ` · ${atrasadas} atrasada(s)` : ""}`}
          destaque={atrasadas > 0 ? "perigo" : undefined}
        />
        {avisosNovos === undefined ? (
          <Indicador
            icone={CalendarClock}
            rotulo="Atividades entregues"
            valor={itens ? String(entregues) : "…"}
            detalhe="No ano letivo"
          />
        ) : (
          <Indicador
            icone={CalendarClock}
            rotulo="Avisos novos"
            valor={String(avisosNovos)}
            detalhe="Faltas, notas, atividades e comunicados"
            destaque={avisosNovos > 0 ? "alerta" : undefined}
          />
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Painel
          titulo="Desempenho por disciplina"
          icone={BarChart3}
          semEspaco
          className="lg:col-span-2"
          ferramentas={
            <Button variant="ghost" size="sm" onClick={() => aoAbrir("notas")}>
              Ver boletim
            </Button>
          }
        >
          {linhas.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              {boletim && frequencia ? "Nenhuma nota ou aula registrada ainda." : "Carregando…"}
            </p>
          ) : (
            <Table>
              <TableHeader className={classeCabecalhoTabela}>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Disciplina</TableHead>
                  <TableHead className="text-right">Média</TableHead>
                  <TableHead className="text-right">Presença</TableHead>
                  <TableHead className="pr-4">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((l) => {
                  const abaixo = l.presenca !== null && l.presenca < PRESENCA_MINIMA;
                  const notaBaixa = l.media !== null && l.media < 6;
                  return (
                    <TableRow key={l.nome}>
                      <TableCell className="py-3 pl-4 font-medium text-foreground">
                        {l.nome}
                      </TableCell>
                      <TableCell
                        className={cn("text-right tabular-nums", notaBaixa && "text-destructive")}
                      >
                        {formatarNota(l.media)}
                      </TableCell>
                      <TableCell
                        className={cn("text-right tabular-nums", abaixo && "text-destructive")}
                      >
                        {l.presenca === null ? "—" : `${l.presenca}%`}
                      </TableCell>
                      <TableCell className="pr-4">
                        {abaixo || notaBaixa ? (
                          <Etiqueta tom="perigo">Precisa de atenção</Etiqueta>
                        ) : l.presenca !== null && situacaoPresenca(l.presenca).tom === "alerta" ? (
                          <Etiqueta tom="alerta">Atenção à frequência</Etiqueta>
                        ) : (
                          <Etiqueta tom="sucesso">Em dia</Etiqueta>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Painel>

        <Painel
          titulo="Próximas entregas"
          icone={CalendarClock}
          semEspaco
          ferramentas={
            <Button variant="ghost" size="sm" onClick={() => aoAbrir("atividades")}>
              Ver todas
            </Button>
          }
        >
          {pendentes === null && <p className="p-4 text-sm text-muted-foreground">Carregando…</p>}
          {pendentes?.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              Nenhuma atividade pendente no {nomeBimestre(bimestre)}.
            </p>
          )}
          {pendentes && pendentes.length > 0 && (
            <ul className="divide-y divide-border">
              {pendentes.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-primary">
                    {formatarData(a.prazoData).slice(0, 5)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {a.titulo}
                    </span>
                    <span className="block text-xs text-muted-foreground">{a.disciplina}</span>
                  </span>
                  {a.situacao !== "proxima" && (
                    <Etiqueta tom={situacaoAtividade[a.situacao].tom}>
                      {situacaoAtividade[a.situacao].texto}
                    </Etiqueta>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>
    </div>
  );
}

const BIMESTRES_BOLETIM: { id: Bimestre; rotulo: string }[] = [
  { id: "PRIMEIRO", rotulo: "1º bim" },
  { id: "SEGUNDO", rotulo: "2º bim" },
  { id: "TERCEIRO", rotulo: "3º bim" },
  { id: "QUARTO", rotulo: "4º bim" },
];

const NOTA_MINIMA = 6;

function Nota({ valor, negrito = false }: { valor: number | null; negrito?: boolean }) {
  if (valor === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "tabular-nums",
        negrito && "font-semibold",
        valor < NOTA_MINIMA ? "text-destructive" : "text-foreground",
      )}
    >
      {formatarNota(valor)}
    </span>
  );
}

export function BoletimEscolar({
  boletim,
  frequencia,
}: {
  boletim: BoletimDisciplinaDTO[];
  frequencia: FrequenciaDTO[] | null;
}) {
  const linhas = new Map<
    number,
    { nome: string; disciplina: BoletimDisciplinaDTO | null; faltas: number | null }
  >();
  for (const d of boletim) {
    linhas.set(d.disciplinaId, { nome: d.disciplinaTitle, disciplina: d, faltas: null });
  }
  for (const f of frequencia ?? []) {
    const atual = linhas.get(f.disciplinaId);
    linhas.set(f.disciplinaId, {
      nome: f.disciplinaTitle,
      disciplina: atual?.disciplina ?? null,
      faltas: f.totalFaltas,
    });
  }
  const ordenadas = [...linhas.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const celula = "border border-border px-3 py-2";
  const cabecalho = "whitespace-nowrap border border-primary px-3 py-2 font-semibold";

  if (ordenadas.length === 0) {
    return (
      <p className="p-10 text-center text-sm text-muted-foreground">
        Nenhuma nota lançada ainda. As notas aparecem aqui assim que os professores lançarem.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th scope="col" className={cn(cabecalho, "text-left")}>
                Disciplina
              </th>
              {BIMESTRES_BOLETIM.map((b) => (
                <th key={b.id} scope="col" className={cn(cabecalho, "w-20 text-center")}>
                  {b.rotulo}
                </th>
              ))}
              <th scope="col" className={cn(cabecalho, "w-24 text-center")}>
                Média final
              </th>
              <th scope="col" className={cn(cabecalho, "w-20 text-center")}>
                Faltas
              </th>
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((l) => (
              <tr key={l.nome} className="odd:bg-card even:bg-muted/40">
                <th scope="row" className={cn(celula, "text-left font-medium text-foreground")}>
                  {l.nome}
                </th>
                {BIMESTRES_BOLETIM.map((b) => (
                  <td key={b.id} className={cn(celula, "text-center")}>
                    <Nota
                      valor={l.disciplina?.bimestres.find((x) => x.bimestre === b.id)?.nota ?? null}
                    />
                  </td>
                ))}
                <td className={cn(celula, "bg-primary/5 text-center")}>
                  <Nota valor={l.disciplina?.mediaFinal ?? null} negrito />
                </td>
                <td className={cn(celula, "text-center tabular-nums")}>
                  {l.faltas === null ? <span className="text-muted-foreground">—</span> : l.faltas}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        — sem nota lançada · em vermelho: abaixo de {formatarNota(NOTA_MINIMA)} · faltas no ano
        letivo
      </p>
    </div>
  );
}
