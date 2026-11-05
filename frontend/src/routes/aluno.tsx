import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  RefreshCw,
  UserX,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BoletimMatriz } from "@/components/BoletimMatriz";
import { PainelLateral, Secao, type SecaoPainel } from "@/components/PainelLateral";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/blocos";
import { ListaAtividades } from "@/components/ListaAtividades";
import { paraAtividadeAluno } from "@/lib/atividadesAluno";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { aluno, horarios } from "@/data/notus";
import {
  ApiError,
  getMeuPerfil,
  getMinhaFrequencia,
  getMinhasAtividades,
  getMinhasFaltas,
  type AtividadeDTO,
  type FaltaDTO,
  type FrequenciaDTO,
} from "@/lib/api";
import { getSession } from "@/lib/auth";
import { diasEntre, formatarData, hojeLocal } from "@/lib/datas";

export const Route = createFileRoute("/aluno")({
  head: () => ({
    meta: [
      { title: "Painel do Aluno · NOTUS" },
      {
        name: "description",
        content:
          "Atividades com prazo, notas recentes, quadro de horários e presença por disciplina.",
      },
      { property: "og:title", content: "Painel do Aluno · NOTUS" },
      {
        property: "og:description",
        content:
          "Veja o que entregar, suas notas, seus horários e sua frequência em cada disciplina.",
      },
    ],
  }),
  component: PainelAluno,
});

type SecaoId = "hoje" | "atividades" | "notas" | "presenca" | "semana" | "faltas";

const secoes: SecaoPainel<SecaoId>[] = [
  {
    id: "hoje",
    label: "Aulas de hoje",
    icon: CalendarClock,
  },
  {
    // Uma aba só: a lista mostra a situação de cada atividade (atrasada, para entregar,
    // entregue) e tem filtro; o número ao lado conta as atrasadas.
    id: "atividades",
    label: "Atividades",
    icon: ClipboardList,
  },
  {
    id: "notas",
    label: "Notas",
    icon: BarChart3,
  },
  {
    id: "presenca",
    label: "Presença por disciplina",
    icon: UserX,
  },
  {
    id: "semana",
    label: "Quadro semanal",
    icon: CalendarDays,
  },
  {
    id: "faltas",
    label: "Faltas registradas",
    icon: UserX,
  },
];

function diaDeHoje() {
  const idx = new Date().getDay() - 1; // 0 = segunda ... 4 = sexta
  const util = idx >= 0 && idx <= 4;
  return { idx: util ? idx : 0, util };
}

function PainelAluno() {
  const [secao, setSecao] = useState<SecaoId>("hoje");
  const [primeiroNome, setPrimeiroNome] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    getMeuPerfil()
      .then((perfil) => ativo && setPrimeiroNome(perfil.nome?.split(" ")[0] ?? null))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const [atividadesApi, setAtividadesApi] = useState<AtividadeDTO[] | null>(null);
  const [erroAtividades, setErroAtividades] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    getMinhasAtividades()
      .then((lista) => ativo && setAtividadesApi(lista))
      .catch(
        (e) =>
          ativo &&
          setErroAtividades(e instanceof ApiError ? e.message : "Erro ao carregar as atividades."),
      );
    return () => {
      ativo = false;
    };
  }, []);

  const atividades = useMemo(() => {
    const hoje = hojeLocal();
    return (atividadesApi ?? []).map((a) => paraAtividadeAluno(a, hoje));
  }, [atividadesApi]);

  const atrasadas = atividades.filter((a) => a.situacao === "atrasada");
  const secoesComContador = secoes.map((s) =>
    s.id === "atividades" ? { ...s, contador: atrasadas.length } : s,
  );

  const avisoCarga = erroAtividades ? (
    <p className="mb-4 text-base font-semibold text-destructive">{erroAtividades}</p>
  ) : atividadesApi === null ? (
    <p className="mb-4 text-base text-muted-foreground">Carregando atividades…</p>
  ) : null;

  return (
    <AppShell role="ROLE_ALUNO" titulo={`Olá, ${primeiroNome ?? "..."}!`}>
      <PainelLateral secoes={secoesComContador} secaoAtiva={secao} aoSelecionarSecao={setSecao}>
        {secao === "hoje" && <AulasDeHoje />}
        {secao === "atividades" && (
          <Secao titulo="Atividades">
            {avisoCarga}
            {atividadesApi !== null && <ListaAtividades itens={atividades} />}
          </Secao>
        )}
        {secao === "notas" && <Notas />}
        {secao === "presenca" && <Presenca />}
        {secao === "semana" && <QuadroSemanal />}
        {secao === "faltas" && <FaltasBackend />}
      </PainelLateral>
    </AppShell>
  );
}

function AulasDeHoje() {
  const [hoje, setHoje] = useState<{ idx: number; util: boolean } | null>(null);
  useEffect(() => setHoje(diaDeHoje()), []);
  if (!hoje) return null;

  const nomeDia = horarios.dias[hoje.idx];
  return (
    <Secao
      titulo={hoje.util ? `Aulas de hoje, ${(nomeDia ?? "").toLowerCase()}` : "Hoje não há aulas"}
    >
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {horarios.aulas.map((a) => (
            <div key={a.hora} className="flex items-center gap-4 px-6 py-4">
              <span className="w-20 shrink-0 font-display text-xl font-bold text-primary">
                {a.hora}
              </span>
              <span className="text-lg text-foreground">{a.grade[hoje.idx]}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </Secao>
  );
}

function Notas() {
  const studentId = getSession()?.userId;
  const [versao, setVersao] = useState(0);

  return (
    <Secao titulo="Boletim">
      {studentId ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="min-h-10 text-base"
              onClick={() => setVersao((v) => v + 1)}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Atualizar
            </Button>
          </div>
          <BoletimMatriz key={versao} studentId={studentId} />
        </div>
      ) : (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden="true" />
            <p className="text-base font-semibold text-destructive">
              Não foi possível identificar o aluno. Saia e entre novamente.
            </p>
          </CardContent>
        </Card>
      )}
    </Secao>
  );
}

function Presenca() {
  const [frequencia, setFrequencia] = useState<FrequenciaDTO[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function buscar() {
    setCarregando(true);
    setErro(null);
    try {
      setFrequencia(await getMinhaFrequencia());
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar a frequência.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void buscar();
  }, []);

  const geral = frequencia?.length
    ? Math.round(frequencia.reduce((s, f) => s + f.percentualPresenca, 0) / frequencia.length)
    : null;

  return (
    <Secao
      titulo="Presença por disciplina"
      etiqueta={
        geral !== null && (
          <span
            className={`text-base ${geral >= 75 ? "text-muted-foreground" : "font-semibold text-destructive"}`}
          >
            Presença geral de {geral}% (mínimo 75%)
          </span>
        )
      }
    >
      <Card>
        <CardContent className="space-y-5 p-6">
          <Button
            onClick={buscar}
            disabled={carregando}
            variant="outline"
            className="min-h-11 text-base"
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </Button>
          {erro && <p className="text-base font-semibold text-destructive">{erro}</p>}
          {!erro && frequencia === null && (
            <p className="text-base text-muted-foreground">Carregando…</p>
          )}
          {frequencia && frequencia.length === 0 && (
            <p className="text-base text-muted-foreground">
              Nenhuma aula registrada ainda pelo professor — a presença aparece aqui assim que a
              chamada começar.
            </p>
          )}
          {frequencia?.map((f) => {
            const pct = Math.round(f.percentualPresenca);
            return (
              <div key={f.disciplinaId}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-semibold text-foreground">{f.disciplinaTitle}</span>
                  <span className="text-base text-muted-foreground">
                    {f.totalFaltas} {f.totalFaltas === 1 ? "falta" : "faltas"} de {f.totalAulas}{" "}
                    {f.totalAulas === 1 ? "aula" : "aulas"}, {pct}%
                  </span>
                </div>
                <Progress value={pct} className="mt-2 h-3" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </Secao>
  );
}

function QuadroSemanal() {
  return (
    <Secao titulo="Quadro de horários">
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">Horário semanal de aulas</caption>
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th
                  scope="col"
                  className="px-4 py-3 text-base font-semibold text-secondary-foreground"
                >
                  Hora
                </th>
                {horarios.dias.map((d) => (
                  <th
                    key={d}
                    scope="col"
                    className="px-4 py-3 text-base font-semibold text-secondary-foreground"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horarios.aulas.map((a) => (
                <tr key={a.hora} className="border-b border-border last:border-0">
                  <th scope="row" className="px-4 py-3 text-base font-semibold text-foreground">
                    {a.hora}
                  </th>
                  {a.grade.map((m, i) => (
                    <td key={i} className="px-4 py-3 text-base text-muted-foreground">
                      {m}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </Secao>
  );
}

type LinhaFaltas = {
  disciplinaId: number;
  disciplina: string;
  faltas: number;
  aulas: number | null;
  presenca: number | null;
  dias: string[];
};

// Faltas por disciplina numa tabela, no mesmo formato do boletim: uma linha por matéria e
// uma linha de total no fim. Junta a frequência (aulas e presença) com as faltas registradas.
function FaltasBackend() {
  const [linhas, setLinhas] = useState<LinhaFaltas[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function buscar() {
    setCarregando(true);
    setErro(null);
    try {
      const [faltas, frequencia] = await Promise.all([
        getMinhasFaltas(),
        getMinhaFrequencia().catch((): FrequenciaDTO[] => []),
      ]);
      setLinhas(montarLinhas(faltas, frequencia));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao buscar as faltas.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void buscar();
  }, []);

  const totalFaltas = linhas?.reduce((s, l) => s + l.faltas, 0) ?? 0;
  const totalAulas = linhas?.reduce((s, l) => s + (l.aulas ?? 0), 0) ?? 0;
  const presencaGeral =
    totalAulas > 0 ? Math.round(((totalAulas - totalFaltas) / totalAulas) * 100) : null;

  return (
    <Secao titulo="Faltas por disciplina">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={buscar}
            disabled={carregando}
            variant="outline"
            className="min-h-11 text-base"
          >
            <RefreshCw
              className={`size-5 ${carregando ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {carregando ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
        {erro && <p className="text-base font-semibold text-destructive">{erro}</p>}
        {linhas && linhas.length === 0 && (
          <p className="text-base text-muted-foreground">Nenhuma aula ou falta registrada ainda.</p>
        )}
        {linhas && linhas.length > 0 && (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-base font-semibold text-foreground">
                  Disciplina
                </TableHead>
                <TableHead className="text-center text-base font-semibold text-foreground">
                  Faltas
                </TableHead>
                <TableHead className="whitespace-nowrap text-center text-base font-semibold text-foreground">
                  Aulas registradas
                </TableHead>
                <TableHead className="bg-primary/5 text-center text-base font-semibold text-foreground">
                  Presença
                </TableHead>
                <TableHead className="text-base font-semibold text-foreground">
                  Dias com falta
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.disciplinaId}>
                  <TableCell className="text-base font-semibold text-foreground">
                    {l.disciplina}
                  </TableCell>
                  <TableCell className="text-center text-base font-semibold tabular-nums text-foreground">
                    {l.faltas}
                  </TableCell>
                  <TableCell className="text-center text-base tabular-nums text-muted-foreground">
                    {l.aulas ?? "–"}
                  </TableCell>
                  <TableCell className="bg-primary/5 text-center">
                    <PercentualPresenca valor={l.presenca} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {l.dias.length > 0 ? l.dias.join(", ") : "Nenhuma"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableCell className="text-base font-semibold text-foreground">Total</TableCell>
                <TableCell className="text-center text-base font-semibold tabular-nums text-foreground">
                  {totalFaltas}
                </TableCell>
                <TableCell className="text-center text-base tabular-nums text-muted-foreground">
                  {totalAulas}
                </TableCell>
                <TableCell className="bg-primary/5 text-center">
                  <PercentualPresenca valor={presencaGeral} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Mínimo de 75% de presença
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>
    </Secao>
  );
}

function PercentualPresenca({ valor }: { valor: number | null }) {
  if (valor === null) return <span className="text-base text-muted-foreground">–</span>;
  return (
    <span
      className={`text-base font-semibold tabular-nums ${valor < 75 ? "text-destructive" : "text-success"}`}
    >
      {valor}%
    </span>
  );
}

function montarLinhas(faltas: FaltaDTO[], frequencia: FrequenciaDTO[]): LinhaFaltas[] {
  const linhas = new Map<number, LinhaFaltas>();
  for (const f of frequencia) {
    linhas.set(f.disciplinaId, {
      disciplinaId: f.disciplinaId,
      disciplina: f.disciplinaTitle,
      faltas: 0,
      aulas: f.totalAulas,
      presenca: Math.round(f.percentualPresenca),
      dias: [],
    });
  }
  for (const f of [...faltas].sort((a, b) => a.data.localeCompare(b.data))) {
    const linha = linhas.get(f.disciplinaId) ?? {
      disciplinaId: f.disciplinaId,
      disciplina: `Disciplina ${f.disciplinaId}`,
      faltas: 0,
      aulas: null,
      presenca: null,
      dias: [],
    };
    linha.faltas += f.quantidade;
    linha.dias.push(formatarData(f.data));
    linhas.set(f.disciplinaId, linha);
  }
  return [...linhas.values()].sort((a, b) => a.disciplina.localeCompare(b.disciplina, "pt-BR"));
}
