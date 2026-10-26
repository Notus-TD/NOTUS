import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { normalizar } from "@/lib/busca";
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

const situacaoInfo = {
  hoje: { texto: "Entregar hoje", classe: "bg-warning text-warning-foreground" },
  atrasada: { texto: "Atrasada", classe: "bg-destructive text-destructive-foreground" },
  proxima: { texto: "Próxima", classe: "bg-secondary text-secondary-foreground" },
  entregue: { texto: "Entregue", classe: "bg-success text-success-foreground" },
} as const;

type SecaoId = "hoje" | "atrasadas" | "atividades" | "notas" | "presenca" | "semana" | "faltas";

const secoes: SecaoPainel<SecaoId>[] = [
  {
    id: "hoje",
    label: "Aulas de hoje",
    descricao: "Grade horária do dia",
    icon: CalendarClock,
    termos: "grade horario aula hoje dia",
  },
  {
    id: "atrasadas",
    label: "Atividades em atraso",
    descricao: "Prazos que já venceram",
    icon: AlertTriangle,
    termos: "atraso atrasada pendente vencida entrega",
  },
  {
    id: "atividades",
    label: "Todas as atividades",
    descricao: "Tudo o que há para entregar",
    icon: ClipboardList,
    termos: "atividade tarefa trabalho entregar lista",
  },
  {
    id: "notas",
    label: "Notas recentes",
    descricao: "Últimas avaliações",
    icon: BarChart3,
    termos: "nota prova media avaliação boletim",
  },
  {
    id: "presenca",
    label: "Presença por disciplina",
    descricao: "Frequência em cada matéria",
    icon: UserX,
    termos: "presenca falta frequencia",
  },
  {
    id: "semana",
    label: "Quadro semanal",
    descricao: "Horários de segunda a sexta",
    icon: CalendarDays,
    termos: "semana horario quadro grade",
  },
  {
    id: "faltas",
    label: "Faltas registradas",
    descricao: "Registros oficiais da escola",
    icon: UserX,
    termos: "falta registro backend oficial",
  },
];

function diaDeHoje() {
  const idx = new Date().getDay() - 1; // 0 = segunda ... 4 = sexta
  const util = idx >= 0 && idx <= 4;
  return { idx: util ? idx : 0, util };
}

function PainelAluno() {
  const [busca, setBusca] = useState("");
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
    s.id === "atrasadas" ? { ...s, contador: atrasadas.length } : s,
  );

  const atividadesEncontradas = useMemo(() => {
    const q = normalizar(busca.trim());
    if (q.length < 2) return [];
    return atividades.filter((a) =>
      normalizar(`${a.titulo} ${a.disciplina} ${a.descricao}`).includes(q),
    );
  }, [busca, atividades]);

  const avisoCarga = erroAtividades ? (
    <p className="mb-4 text-base font-semibold text-destructive">{erroAtividades}</p>
  ) : atividadesApi === null ? (
    <p className="mb-4 text-base text-muted-foreground">Carregando atividades…</p>
  ) : null;

  return (
    <AppShell
      role="ROLE_ALUNO"
      titulo={`Olá, ${primeiroNome ?? "..."}!`}
      subtitulo={`${aluno.turma} · Use a busca ao lado para encontrar o que precisa.`}
    >
      <PainelLateral
        secoes={secoesComContador}
        secaoAtiva={secao}
        aoSelecionarSecao={setSecao}
        busca={busca}
        aoMudarBusca={setBusca}
        placeholderBusca="Pesquisar... (ex.: atraso, notas)"
      >
        {atividadesEncontradas.length > 0 && (
          <div>
            <h2 className="mb-3 font-display text-xl font-bold text-foreground">
              Atividades que combinam com "{busca}"
            </h2>
            <ListaAtividades itens={atividadesEncontradas} />
          </div>
        )}

        {secao === "hoje" && <AulasDeHoje />}
        {secao === "atrasadas" && (
          <Secao
            titulo="Atividades em atraso"
            descricao={
              atrasadas.length
                ? `${atrasadas.length} com prazo vencido`
                : "Nenhuma atividade atrasada. Parabéns!"
            }
          >
            {avisoCarga}
            <ListaAtividades itens={atrasadas} />
          </Secao>
        )}
        {secao === "atividades" && (
          <Secao
            titulo="Todas as atividades"
            descricao={`${atividades.filter((a) => a.situacao !== "entregue").length} para entregar`}
          >
            {avisoCarga}
            <ListaAtividades itens={atividades} />
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
      titulo={hoje.util ? `Aulas de hoje — ${nomeDia}` : "Hoje não há aulas"}
      descricao={
        hoje.util
          ? `${horarios.aulas.length} aulas, começando às ${horarios.aulas[0]?.hora}`
          : `Fim de semana. Veja como começa a ${nomeDia?.toLowerCase()}:`
      }
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

type Situacao = keyof typeof situacaoInfo;

type AtividadeAluno = {
  id: number;
  titulo: string;
  disciplina: string;
  prazo: string;
  situacao: Situacao;
  descricao: string;
};

/** Converte a atividade da API no formato da lista, com a situação calculada pelo prazo. */
function paraAtividadeAluno(a: AtividadeDTO, hoje: string): AtividadeAluno {
  const dias = diasEntre(hoje, a.prazo);
  let situacao: Situacao;
  let prazo: string;
  if (a.entregue) {
    situacao = "entregue";
    prazo = `Prazo ${formatarData(a.prazo)}`;
  } else if (dias < 0) {
    situacao = "atrasada";
    prazo = dias === -1 ? "Prazo venceu ontem" : `Prazo venceu em ${formatarData(a.prazo)}`;
  } else if (dias === 0) {
    situacao = "hoje";
    prazo = "Entregar hoje";
  } else {
    situacao = "proxima";
    prazo =
      dias === 1 ? "Entregar amanhã" : `Entregar até ${formatarData(a.prazo)} (em ${dias} dias)`;
  }
  return {
    id: a.id,
    titulo: a.title,
    disciplina: a.disciplinaTitle,
    prazo,
    situacao,
    descricao: a.content,
  };
}

function ListaAtividades({ itens }: { itens: AtividadeAluno[] }) {
  if (itens.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-base text-muted-foreground">
          Nenhuma atividade aqui.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-4">
      {itens.map((a) => {
        const info = situacaoInfo[a.situacao];
        return (
          <Card key={a.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{a.titulo}</CardTitle>
                  <CardDescription className="mt-1 text-base">
                    {a.disciplina} · {a.prazo}
                  </CardDescription>
                </div>
                <Badge className={`${info.classe} px-3 py-1 text-sm font-semibold`}>
                  {info.texto}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-base text-muted-foreground">{a.descricao}</CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Notas() {
  const studentId = getSession()?.userId;
  const [versao, setVersao] = useState(0);

  return (
    <Secao
      titulo="Boletim"
      descricao="Nota de cada matéria por bimestre, com a média do semestre e a média anual."
    >
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
      descricao={
        geral !== null
          ? `Presença geral: ${geral}% · mínimo exigido 75%`
          : "Calculada a partir das aulas e faltas registradas pelo professor."
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
                    {f.totalAulas === 1 ? "aula" : "aulas"} · {pct}%
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
    <Secao titulo="Quadro de horários" descricao="Segunda a sexta">
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

function FaltasBackend() {
  const [faltas, setFaltas] = useState<FaltaDTO[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function buscar() {
    setCarregando(true);
    setErro(null);
    try {
      setFaltas(await getMinhasFaltas());
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao buscar as faltas.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void buscar();
  }, []);

  return (
    <Secao
      titulo="Faltas registradas"
      descricao="Suas faltas lançadas pelo professor."
    >
      <Card>
        <CardContent className="space-y-4 p-6">
          <Button
            onClick={buscar}
            disabled={carregando}
            variant="outline"
            className="min-h-11 text-base"
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </Button>
          {erro && <p className="text-base font-semibold text-destructive">{erro}</p>}
          {faltas && faltas.length === 0 && (
            <p className="text-base text-muted-foreground">Nenhuma falta registrada.</p>
          )}
          {faltas && faltas.length > 0 && (
            <ul className="divide-y divide-border text-base">
              {faltas.map((f) => (
                <li key={f.id} className="py-2">
                  Falta #{f.id} — disciplina {f.disciplinaId}, {f.quantidade}{" "}
                  {f.quantidade === 1 ? "falta" : "faltas"} em {f.data}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </Secao>
  );
}
