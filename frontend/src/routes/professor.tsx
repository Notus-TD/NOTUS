import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Home,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BoletimMatriz } from "@/components/BoletimMatriz";
import { PainelLateral, Secao, type SecaoPainel } from "@/components/PainelLateral";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError,
  associarFalta,
  deleteAtividade,
  deleteFalta,
  getAtividadesDaTurma,
  getEntregasDaAtividade,
  getFaltasByStudent,
  getMeuPerfil,
  getMinhasTurmas,
  getStudentsByTurma,
  marcarEntrega,
  publicarAtividade,
  registrarAula,
  type AtividadeDTO,
  type Bimestre,
  type FaltaDTO,
  type StatusEntrega,
  type StudentMinDTO,
  type TurmaComDisciplinasDTO,
} from "@/lib/api";
import { BIMESTRES, bimestreAtual, nomeBimestre } from "@/lib/bimestres";
import { normalizar } from "@/lib/busca";
import { formatarData, hojeLocal } from "@/lib/datas";
import { ORDEM_STATUS_ENTREGA, STATUS_ENTREGA } from "@/lib/entregas";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/professor")({
  head: () => ({
    meta: [
      { title: "Painel do Professor · NOTUS" },
      {
        name: "description",
        content:
          "Diário de classe simplificado: chamada, lançamento de notas e atividades para as turmas.",
      },
      { property: "og:title", content: "Painel do Professor · NOTUS" },
      {
        property: "og:description",
        content:
          "Faça a chamada, lance notas e publique atividades para suas turmas em poucos toques.",
      },
    ],
  }),
  component: PainelProfessor,
});

type SecaoId = "inicio" | "chamada" | "notas" | "atividades";

const secoes: SecaoPainel<SecaoId>[] = [
  {
    id: "inicio",
    label: "Início",
    descricao: "Resumo das turmas e prazos",
    icon: Home,
    termos: "inicio home resumo painel turmas prazos",
  },
  {
    id: "chamada",
    label: "Chamada",
    descricao: "Presença da turma por dia",
    icon: ClipboardCheck,
    termos: "chamada falta faltas presenca frequencia dia data aula",
  },
  {
    id: "notas",
    label: "Notas",
    descricao: "Lançar e editar notas",
    icon: BarChart3,
    termos: "nota notas avaliacao prova lancar",
  },
  {
    id: "atividades",
    label: "Atividades",
    descricao: "Publicar tarefas com prazo",
    icon: ClipboardList,
    termos: "atividade atividades tarefa trabalho prazo publicar recado aviso",
  },
];

type DisciplinaRef = { id: number; title: string };

async function alunosAtivosDaTurma(turmaId: number) {
  const alunos = await getStudentsByTurma(turmaId, "nome");
  return alunos
    .filter((a) => a.matriculaStatus === "ATIVA")
    .sort((a, b) => a.studentName.localeCompare(b.studentName, "pt-BR"));
}

function PainelProfessor() {
  const [busca, setBusca] = useState("");
  const [secao, setSecao] = useState<SecaoId>("inicio");
  const [minhasTurmas, setMinhasTurmas] = useState<TurmaComDisciplinasDTO[] | null>(null);
  const [turmaId, setTurmaId] = useState<number | null>(null);
  const [disciplinaId, setDisciplinaId] = useState<number | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [nomeProfessor, setNomeProfessor] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    getMinhasTurmas()
      .then((lista) => {
        if (!ativo) return;
        setMinhasTurmas(lista);
        setTurmaId((atual) => atual ?? lista[0]?.turmaId ?? null);
      })
      .catch(
        (e) =>
          ativo &&
          setErroCarregamento(e instanceof ApiError ? e.message : "Erro ao carregar suas turmas."),
      );
    getMeuPerfil()
      .then((perfil) => ativo && setNomeProfessor(perfil.nome))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const turmaAtual = minhasTurmas?.find((t) => t.turmaId === turmaId) ?? null;
  const disciplina: DisciplinaRef | null =
    turmaAtual?.disciplinas.find((d) => d.id === disciplinaId) ??
    turmaAtual?.disciplinas[0] ??
    null;

  const termo = normalizar(busca.trim());
  const turmasFiltradas = (minhasTurmas ?? []).filter(
    (t) =>
      !termo ||
      normalizar(
        `${t.turmaName} ${t.schoolYear} ${t.disciplinas.map((d) => d.title).join(" ")}`,
      ).includes(termo),
  );

  function selecionarPrimeiraTurmaEncontrada() {
    if (!termo || !turmasFiltradas[0]) return false;
    setTurmaId(turmasFiltradas[0].turmaId);
    return true;
  }

  const listaDeTurmas = (
    <div className="space-y-1 border-b border-border pb-3">
      <p className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Turmas
      </p>
      {minhasTurmas === null && !erroCarregamento && (
        <p className="px-3 py-2 text-base text-muted-foreground">Carregando…</p>
      )}
      {minhasTurmas?.length === 0 && (
        <p className="px-3 py-2 text-base text-muted-foreground">
          Você ainda não está associado a nenhuma turma.
        </p>
      )}
      {minhasTurmas && minhasTurmas.length > 0 && turmasFiltradas.length === 0 && (
        <p className="px-3 py-2 text-base text-muted-foreground">
          Nenhuma turma encontrada para "{busca}".
        </p>
      )}
      {turmasFiltradas.map((t) => {
        const ativa = t.turmaId === turmaId;
        return (
          <button
            key={t.turmaId}
            type="button"
            aria-pressed={ativa}
            onClick={() => {
              setTurmaId(t.turmaId);
              setBusca("");
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
              ativa ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-accent"
            }`}
          >
            <Users
              className={`size-5 shrink-0 ${ativa ? "text-primary" : "text-muted-foreground"}`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-foreground">{t.turmaName}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {t.disciplinas.map((d) => d.title).join(", ")} · {t.schoolYear}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <AppShell
      role="ROLE_PROFESSOR"
      titulo="Diário de classe"
      subtitulo={`${nomeProfessor ? `Prof. ${nomeProfessor} · ` : ""}Escolha a turma ao lado e registre a chamada, as notas e as atividades.`}
    >
      <PainelLateral
        secoes={secoes}
        secaoAtiva={secao}
        aoSelecionarSecao={setSecao}
        busca={busca}
        aoMudarBusca={setBusca}
        placeholderBusca="Pesquisar turma ou seção..."
        aoPressionarEnter={selecionarPrimeiraTurmaEncontrada}
        topo={listaDeTurmas}
      >
        {erroCarregamento && (
          <p className="text-base font-semibold text-destructive">{erroCarregamento}</p>
        )}
        {!erroCarregamento && minhasTurmas === null && (
          <p className="text-base text-muted-foreground">Carregando suas turmas…</p>
        )}
        {minhasTurmas?.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-base text-muted-foreground">
              Você ainda não está associado a nenhuma turma. Procure a secretaria da escola.
            </CardContent>
          </Card>
        )}
        {minhasTurmas && minhasTurmas.length > 0 && secao === "inicio" && (
          <InicioProfessor
            turmas={minhasTurmas}
            nomeProfessor={nomeProfessor}
            aoAbrir={(id, destino) => {
              setTurmaId(id);
              setSecao(destino);
            }}
          />
        )}
        {secao !== "inicio" && turmaAtual && !disciplina && (
          <p className="text-base font-semibold text-destructive">
            Nenhuma disciplina associada a você nesta turma. Procure a secretaria da escola.
          </p>
        )}
        {secao !== "inicio" && turmaAtual && disciplina && turmaAtual.disciplinas.length > 1 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Disciplina">
            <span className="text-base font-semibold text-foreground">Disciplina:</span>
            {turmaAtual.disciplinas.map((d) => (
              <Button
                key={d.id}
                variant={d.id === disciplina.id ? "default" : "outline"}
                aria-pressed={d.id === disciplina.id}
                className="min-h-11 text-base"
                onClick={() => setDisciplinaId(d.id)}
              >
                {d.title}
              </Button>
            ))}
          </div>
        )}

        {turmaAtual && disciplina && secao === "chamada" && (
          <Chamada
            key={`${turmaAtual.turmaId}-${disciplina.id}`}
            turmaId={turmaAtual.turmaId}
            turmaName={turmaAtual.turmaName}
            disciplina={disciplina}
          />
        )}
        {turmaAtual && disciplina && secao === "notas" && (
          <NotasDaTurma
            key={`${turmaAtual.turmaId}-${disciplina.id}`}
            turmaId={turmaAtual.turmaId}
            turmaName={turmaAtual.turmaName}
            disciplina={disciplina}
          />
        )}
        {turmaAtual && disciplina && secao === "atividades" && (
          <Atividades
            key={`${turmaAtual.turmaId}-${disciplina.id}`}
            turmaId={turmaAtual.turmaId}
            turmaName={turmaAtual.turmaName}
            disciplina={disciplina}
          />
        )}
      </PainelLateral>
    </AppShell>
  );
}

type ResumoTurma = { alunos: number; proximas: AtividadeDTO[] };

function InicioProfessor({
  turmas,
  nomeProfessor,
  aoAbrir,
}: {
  turmas: TurmaComDisciplinasDTO[];
  nomeProfessor: string | null;
  aoAbrir: (turmaId: number, secao: Exclude<SecaoId, "inicio">) => void;
}) {
  const hoje = hojeLocal();
  const [resumos, setResumos] = useState<Record<number, ResumoTurma> | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all(
      turmas.map(async (t) => {
        const ids = new Set(t.disciplinas.map((d) => d.id));
        const [alunos, atividades] = await Promise.all([
          alunosAtivosDaTurma(t.turmaId),
          getAtividadesDaTurma(t.turmaId),
        ]);
        const proximas = atividades
          .filter((a) => ids.has(a.disciplinaId) && a.prazo >= hoje)
          .sort((a, b) => a.prazo.localeCompare(b.prazo));
        return [t.turmaId, { alunos: alunos.length, proximas }] as const;
      }),
    )
      .then((pares) => ativo && setResumos(Object.fromEntries(pares)))
      .catch(
        (e) =>
          ativo &&
          setErro(e instanceof ApiError ? e.message : "Erro ao carregar o resumo das turmas."),
      );
    return () => {
      ativo = false;
    };
  }, [turmas, hoje]);

  const prazos = turmas
    .flatMap((t) => (resumos?.[t.turmaId]?.proximas ?? []).map((a) => ({ turma: t, atividade: a })))
    .sort((a, b) => a.atividade.prazo.localeCompare(b.atividade.prazo))
    .slice(0, 5);

  return (
    <Secao
      titulo={nomeProfessor ? `Olá, Prof. ${nomeProfessor}` : "Início"}
      descricao="Suas turmas e os próximos prazos de atividades."
    >
      <div className="space-y-6">
        {erro && <p className="text-base font-semibold text-destructive">{erro}</p>}

        <div className="grid gap-4 md:grid-cols-2">
          {turmas.map((t) => {
            const resumo = resumos?.[t.turmaId];
            return (
              <Card key={t.turmaId}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Users className="size-5 text-primary" aria-hidden="true" />
                    {t.turmaName}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {t.disciplinas.map((d) => d.title).join(", ")} · {t.schoolYear}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-6 text-base">
                    <p>
                      <span className="block text-2xl font-bold tabular-nums text-foreground">
                        {resumo ? resumo.alunos : "…"}
                      </span>
                      <span className="text-muted-foreground">aluno(s) ativos</span>
                    </p>
                    <p>
                      <span className="block text-2xl font-bold tabular-nums text-foreground">
                        {resumo ? resumo.proximas.length : "…"}
                      </span>
                      <span className="text-muted-foreground">atividade(s) em aberto</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="min-h-11 text-base"
                      onClick={() => aoAbrir(t.turmaId, "chamada")}
                    >
                      <ClipboardCheck className="size-5" aria-hidden="true" />
                      Chamada
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-11 text-base"
                      onClick={() => aoAbrir(t.turmaId, "notas")}
                    >
                      <BarChart3 className="size-5" aria-hidden="true" />
                      Notas
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-11 text-base"
                      onClick={() => aoAbrir(t.turmaId, "atividades")}
                    >
                      <ClipboardList className="size-5" aria-hidden="true" />
                      Atividades
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarClock className="size-5 text-primary" aria-hidden="true" />
              Próximos prazos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!erro && resumos === null && (
              <p className="text-base text-muted-foreground">Carregando…</p>
            )}
            {resumos && prazos.length === 0 && (
              <p className="text-base text-muted-foreground">
                Nenhuma atividade com prazo em aberto nas suas turmas.
              </p>
            )}
            {prazos.length > 0 && (
              <ul className="divide-y divide-border">
                {prazos.map(({ turma, atividade }) => (
                  <li key={atividade.id}>
                    <button
                      type="button"
                      onClick={() => aoAbrir(turma.turmaId, "atividades")}
                      className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-3 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="min-w-0">
                        <span className="block text-lg text-foreground">{atividade.title}</span>
                        <span className="block text-sm text-muted-foreground">
                          {turma.turmaName} · {atividade.disciplinaTitle}
                        </span>
                      </span>
                      <span className="text-base font-semibold text-foreground">
                        {atividade.prazo === hoje ? "Hoje" : formatarData(atividade.prazo)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </Secao>
  );
}

function Chamada({
  turmaId,
  turmaName,
  disciplina,
}: {
  turmaId: number;
  turmaName: string;
  disciplina: DisciplinaRef;
}) {
  const hoje = hojeLocal();
  const [data, setData] = useState(hoje);
  const [alunos, setAlunos] = useState<StudentMinDTO[] | null>(null);
  const [faltasDoDia, setFaltasDoDia] = useState<Record<number, FaltaDTO[]> | null>(null);
  const [faltou, setFaltou] = useState<Record<number, boolean>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    alunosAtivosDaTurma(turmaId)
      .then((lista) => ativo && setAlunos(lista))
      .catch(
        (e) =>
          ativo &&
          setErro(e instanceof ApiError ? e.message : "Erro ao carregar os alunos da turma."),
      );
    return () => {
      ativo = false;
    };
  }, [turmaId]);

  useEffect(() => {
    if (!alunos) return;
    let ativo = true;
    setFaltasDoDia(null);
    Promise.all(
      alunos.map(async (a) => {
        const faltas = await getFaltasByStudent(a.userId);
        return [
          a.userId,
          faltas.filter((f) => f.data === data && f.disciplinaId === disciplina.id),
        ] as const;
      }),
    )
      .then((pares) => {
        if (!ativo) return;
        const porAluno = Object.fromEntries(pares) as Record<number, FaltaDTO[]>;
        setFaltasDoDia(porAluno);
        setFaltou(
          Object.fromEntries(pares.map(([id, faltas]) => [id, faltas.length > 0])) as Record<
            number,
            boolean
          >,
        );
      })
      .catch(
        (e) =>
          ativo &&
          setErro(e instanceof ApiError ? e.message : "Erro ao carregar as faltas do dia."),
      );
    return () => {
      ativo = false;
    };
  }, [alunos, data, disciplina.id, versao]);

  const totalJaRegistrado = faltasDoDia
    ? Object.values(faltasDoDia).filter((faltas) => faltas.length > 0).length
    : 0;

  async function salvar() {
    if (!alunos || !faltasDoDia) return;
    setSalvando(true);
    try {
      await registrarAula(disciplina.id, data);
    } catch (e) {
      setSalvando(false);
      toast.error(e instanceof ApiError ? e.message : "Erro ao registrar a aula do dia.");
      return;
    }

    let lancadas = 0;
    let removidas = 0;
    let primeiroErro: string | null = null;
    for (const a of alunos) {
      const existentes = faltasDoDia[a.userId] ?? [];
      try {
        if (faltou[a.userId] && existentes.length === 0) {
          await associarFalta({
            data,
            quantidade: 1,
            studentId: a.userId,
            disciplinaId: disciplina.id,
          });
          lancadas++;
        } else if (!faltou[a.userId] && existentes.length > 0) {
          for (const f of existentes) await deleteFalta(f.id);
          removidas++;
        }
      } catch (e) {
        primeiroErro ??= e instanceof ApiError ? e.message : "Erro desconhecido.";
      }
    }
    setSalvando(false);

    const partes = [
      lancadas && `${lancadas} falta(s) lançada(s)`,
      removidas && `${removidas} falta(s) removida(s)`,
    ].filter(Boolean);
    toast.success(
      `Chamada de ${formatarData(data)} salva${partes.length ? `: ${partes.join(", ")}` : "."}`,
    );
    if (primeiroErro) toast.error(`Algumas faltas não foram salvas: ${primeiroErro}`);
    setVersao((v) => v + 1);
  }

  return (
    <Secao titulo="Chamada" descricao={`${turmaName} · ${disciplina.title}`}>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-4 space-y-0">
          <div className="space-y-2">
            <label htmlFor="data-chamada" className="block text-lg font-semibold text-foreground">
              Dia da aula
            </label>
            <Input
              id="data-chamada"
              type="date"
              value={data}
              max={hoje}
              onChange={(e) => e.target.value && setData(e.target.value)}
              className="h-12 w-48 text-lg"
            />
          </div>
          <CardDescription className="max-w-sm text-base">
            {faltasDoDia === null
              ? "Carregando a chamada do dia…"
              : totalJaRegistrado > 0
                ? `${totalJaRegistrado} aluno(s) já com falta em ${formatarData(data)}. Ajuste e salve para corrigir.`
                : `Marque "Faltou" nos alunos ausentes em ${formatarData(data)} e salve.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {erro && <p className="text-base font-semibold text-destructive">{erro}</p>}
          {!erro && alunos === null && (
            <p className="text-base text-muted-foreground">Carregando alunos…</p>
          )}
          {alunos?.length === 0 && (
            <p className="text-base text-muted-foreground">Nenhum aluno ativo nesta turma.</p>
          )}

          {alunos && alunos.length > 0 && (
            <>
              <ul className="divide-y divide-border">
                {alunos.map((a) => {
                  const ausente = faltou[a.userId] === true;
                  return (
                    <li
                      key={a.userId}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <span className="text-lg text-foreground">
                        {a.studentName}{" "}
                        <span className="text-base text-muted-foreground">
                          · matr. {a.matricula}
                        </span>
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant={!ausente ? "default" : "outline"}
                          className="min-h-11 min-w-28 text-base"
                          aria-pressed={!ausente}
                          disabled={faltasDoDia === null}
                          onClick={() => setFaltou({ ...faltou, [a.userId]: false })}
                        >
                          Presente
                        </Button>
                        <Button
                          variant={ausente ? "destructive" : "outline"}
                          className="min-h-11 min-w-28 text-base"
                          aria-pressed={ausente}
                          disabled={faltasDoDia === null}
                          onClick={() => setFaltou({ ...faltou, [a.userId]: true })}
                        >
                          Faltou
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <Button
                onClick={salvar}
                disabled={salvando || faltasDoDia === null}
                className="min-h-12 px-6 text-lg"
              >
                {salvando ? "Salvando..." : `Salvar chamada de ${formatarData(data)}`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Secao>
  );
}

function NotasDaTurma({
  turmaId,
  turmaName,
  disciplina,
}: {
  turmaId: number;
  turmaName: string;
  disciplina: DisciplinaRef;
}) {
  const [alunos, setAlunos] = useState<StudentMinDTO[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [selecionado, setSelecionado] = useState<StudentMinDTO | null>(null);

  useEffect(() => {
    let ativo = true;
    alunosAtivosDaTurma(turmaId)
      .then((lista) => ativo && setAlunos(lista))
      .catch(
        (e) =>
          ativo &&
          setErro(e instanceof ApiError ? e.message : "Erro ao carregar os alunos da turma."),
      );
    return () => {
      ativo = false;
    };
  }, [turmaId]);

  const termo = normalizar(filtro.trim());
  const filtrados = (alunos ?? []).filter(
    (a) =>
      !termo || normalizar(a.studentName).includes(termo) || String(a.matricula).includes(termo),
  );

  return (
    <Secao titulo="Notas" descricao={`${turmaName} · ${disciplina.title}`}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Selecionar aluno</CardTitle>
            <CardDescription className="text-base">
              Escolha um aluno da turma para lançar ou editar as notas de {disciplina.title}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Filtrar por nome ou matrícula…"
                aria-label="Filtrar alunos da turma"
                className="h-12 pl-10 text-lg"
              />
            </div>

            {erro && <p className="text-base font-semibold text-destructive">{erro}</p>}
            {!erro && alunos === null && (
              <p className="text-base text-muted-foreground">Carregando alunos…</p>
            )}
            {alunos && (
              <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                {filtrados.map((a) => (
                  <li key={a.userId}>
                    <button
                      type="button"
                      onClick={() => setSelecionado(a)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        selecionado?.userId === a.userId ? "bg-primary/10" : "hover:bg-muted"
                      }`}
                    >
                      <span className="text-lg text-foreground">{a.studentName}</span>
                      <span className="text-base text-muted-foreground">
                        Matrícula {a.matricula}
                      </span>
                    </button>
                  </li>
                ))}
                {filtrados.length === 0 && (
                  <p className="py-3 text-base text-muted-foreground">Nenhum aluno encontrado.</p>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        {selecionado && (
          <section key={selecionado.userId} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-xl font-bold text-foreground">
                Boletim de {selecionado.studentName}
              </h3>
              <span className="text-sm text-muted-foreground">
                Matrícula {selecionado.matricula}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Clique em um bimestre para lançar as avaliações. Sem nota final, o bimestre mostra a
              média das avaliações. A nota final, se você lançar, substitui essa média.
            </p>
            <BoletimMatriz
              studentId={selecionado.userId}
              editable
              disciplinasDisponiveis={[disciplina]}
            />
          </section>
        )}
      </div>
    </Secao>
  );
}

function Atividades({
  turmaId,
  turmaName,
  disciplina,
}: {
  turmaId: number;
  turmaName: string;
  disciplina: DisciplinaRef;
}) {
  const hoje = hojeLocal();
  const [atividades, setAtividades] = useState<AtividadeDTO[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [prazo, setPrazo] = useState("");
  const [bimestre, setBimestre] = useState<Bimestre>(bimestreAtual());
  const [publicando, setPublicando] = useState(false);
  const [entregasAbertas, setEntregasAbertas] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;
    getAtividadesDaTurma(turmaId)
      .then((lista) => {
        if (!ativo) return;
        setAtividades([...lista].sort((a, b) => b.publicadaEm.localeCompare(a.publicadaEm)));
      })
      .catch(
        (e) =>
          ativo &&
          setErro(e instanceof ApiError ? e.message : "Erro ao carregar as atividades da turma."),
      );
    return () => {
      ativo = false;
    };
  }, [turmaId, versao]);

  async function publicar() {
    if (!titulo.trim() || !corpo.trim() || !prazo) {
      toast.error("Preencha o título, o texto e o prazo da atividade.");
      return;
    }
    if (prazo < hoje) {
      toast.error("O prazo não pode ser uma data passada.");
      return;
    }
    setPublicando(true);
    try {
      await publicarAtividade({
        title: titulo.trim(),
        content: corpo.trim(),
        bimestre,
        prazo,
        turmaId,
        disciplinaId: disciplina.id,
      });
      setTitulo("");
      setCorpo("");
      setPrazo("");
      toast.success(`Atividade de ${disciplina.title} publicada para o ${turmaName}.`);
      setVersao((v) => v + 1);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao publicar a atividade.");
    } finally {
      setPublicando(false);
    }
  }

  const doProfessor = atividades?.filter((a) => a.disciplinaId === disciplina.id) ?? null;

  async function excluir(atividade: AtividadeDTO) {
    try {
      await deleteAtividade(atividade.id);
      toast.success("Atividade excluída.");
      setVersao((v) => v + 1);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao excluir a atividade.");
    }
  }

  return (
    <Secao titulo="Atividades" descricao={`${turmaName} · ${disciplina.title}`}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Nova atividade</CardTitle>
            <CardDescription className="text-base">
              A atividade aparece no painel dos alunos da turma, e os responsáveis recebem um aviso
              por e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="titulo" className="block text-lg font-semibold text-foreground">
                Título
              </label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Trabalho sobre ecossistemas"
                className="h-12 text-lg"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="corpo" className="block text-lg font-semibold text-foreground">
                Texto
              </label>
              <Textarea
                id="corpo"
                rows={4}
                value={corpo}
                onChange={(e) => setCorpo(e.target.value)}
                placeholder="Explique a atividade e o que precisa ser entregue."
                className="text-lg"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label htmlFor="bimestre" className="block text-lg font-semibold text-foreground">
                  Bimestre
                </label>
                <Select value={bimestre} onValueChange={(v) => setBimestre(v as Bimestre)}>
                  <SelectTrigger id="bimestre" className="h-12 w-48 text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BIMESTRES.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="prazo" className="block text-lg font-semibold text-foreground">
                  Prazo de entrega
                </label>
                <Input
                  id="prazo"
                  type="date"
                  value={prazo}
                  min={hoje}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="h-12 w-48 text-lg"
                />
              </div>
            </div>
            <Button onClick={publicar} disabled={publicando} className="min-h-12 px-6 text-lg">
              {publicando ? "Publicando..." : "Publicar para a turma"}
            </Button>
          </CardContent>
        </Card>

        <div>
          <h3 className="mb-4 font-display text-xl font-bold text-foreground">Já publicadas</h3>
          {erro && <p className="text-base font-semibold text-destructive">{erro}</p>}
          {!erro && atividades === null && (
            <p className="text-base text-muted-foreground">Carregando atividades…</p>
          )}
          {doProfessor?.length === 0 && (
            <p className="text-base text-muted-foreground">
              Nenhuma atividade de {disciplina.title} publicada para esta turma ainda.
            </p>
          )}
          <div className="grid gap-4">
            {doProfessor?.map((a) => (
              <Card key={a.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-xl">{a.title}</CardTitle>
                    <CardDescription className="text-base">
                      {nomeBimestre(a.bimestre)} · prazo {formatarData(a.prazo)}
                      {a.prazo < hoje && " (encerrado)"}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="outline"
                      className="min-h-9 text-sm"
                      aria-expanded={entregasAbertas === a.id}
                      onClick={() => setEntregasAbertas(entregasAbertas === a.id ? null : a.id)}
                    >
                      {entregasAbertas === a.id ? "Fechar entregas" : "Marcar entregas"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Excluir ${a.title}`}
                          title="Excluir"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir esta atividade?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{a.title}" deixa de aparecer para os alunos do {turmaName}. Atividades
                            que já têm entregas não podem ser excluídas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => excluir(a)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-base text-muted-foreground">
                  <p>{a.content}</p>
                  {entregasAbertas === a.id && (
                    <EntregasDaAtividade atividadeId={a.id} turmaId={turmaId} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Secao>
  );
}

function EntregasDaAtividade({ atividadeId, turmaId }: { atividadeId: number; turmaId: number }) {
  const [alunos, setAlunos] = useState<StudentMinDTO[] | null>(null);
  const [status, setStatus] = useState<Record<number, StatusEntrega>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([alunosAtivosDaTurma(turmaId), getEntregasDaAtividade(atividadeId)])
      .then(([lista, entregas]) => {
        if (!ativo) return;
        setAlunos(lista);
        setStatus(
          Object.fromEntries(entregas.map((e) => [e.studentId, e.status])) as Record<
            number,
            StatusEntrega
          >,
        );
      })
      .catch(
        (e) =>
          ativo && setErro(e instanceof ApiError ? e.message : "Erro ao carregar as entregas."),
      );
    return () => {
      ativo = false;
    };
  }, [atividadeId, turmaId]);

  async function marcar(studentId: number, novo: StatusEntrega) {
    setSalvandoId(studentId);
    try {
      await marcarEntrega({ atividadeId, studentId, status: novo });
      setStatus((atual) => ({ ...atual, [studentId]: novo }));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao marcar a entrega.");
    } finally {
      setSalvandoId(null);
    }
  }

  const marcados = (alunos ?? []).filter((a) => status[a.userId] !== undefined).length;

  return (
    <div className="space-y-3 border-t border-border pt-4">
      {erro && <p className="text-base font-semibold text-destructive">{erro}</p>}
      {!erro && alunos === null && <p className="text-base">Carregando alunos…</p>}
      {alunos?.length === 0 && <p className="text-base">Nenhum aluno ativo nesta turma.</p>}
      {alunos && alunos.length > 0 && (
        <>
          <p className="text-sm">
            {marcados} de {alunos.length} aluno(s) marcados.
          </p>
          <ul className="divide-y divide-border">
            {alunos.map((a) => (
              <li key={a.userId} className="flex flex-wrap items-center justify-between gap-3 py-2">
                <span className="text-base text-foreground">{a.studentName}</span>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label={`Entrega de ${a.studentName}`}
                >
                  {ORDEM_STATUS_ENTREGA.map((s) => {
                    const selecionado = status[a.userId] === s;
                    return (
                      <Button
                        key={s}
                        size="sm"
                        variant="outline"
                        className={cn("min-h-9 text-sm", selecionado && STATUS_ENTREGA[s].classe)}
                        aria-pressed={selecionado}
                        disabled={salvandoId === a.userId}
                        onClick={() => marcar(a.userId, s)}
                      >
                        {STATUS_ENTREGA[s].label}
                      </Button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
