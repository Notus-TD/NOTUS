import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, ClipboardCheck, Megaphone, Search, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BoletimMatriz } from "@/components/BoletimMatriz";
import { PainelLateral, Secao, type SecaoPainel } from "@/components/PainelLateral";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { recadosPublicados } from "@/data/notus";
import {
  ApiError,
  associarFalta,
  deleteFalta,
  getFaltasByStudent,
  getMeuPerfil,
  getMinhasTurmas,
  getStudentsByTurma,
  registrarAula,
  type FaltaDTO,
  type StudentMinDTO,
  type TurmaComDisciplinasDTO,
} from "@/lib/api";
import { normalizar } from "@/lib/busca";

export const Route = createFileRoute("/professor")({
  head: () => ({
    meta: [
      { title: "Painel do Professor · NOTUS" },
      {
        name: "description",
        content:
          "Diário de classe simplificado: chamada, lançamento de notas e recados para as turmas.",
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

type SecaoId = "chamada" | "notas" | "recados";

const secoes: SecaoPainel<SecaoId>[] = [
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
    id: "recados",
    label: "Recados e atividades",
    descricao: "Avisos para a turma",
    icon: Megaphone,
    termos: "recado aviso atividade publicar",
  },
];

type DisciplinaRef = { id: number; title: string };

/** Data de hoje no fuso do navegador, no formato do input date (aaaa-mm-dd). */
function hojeLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function formatarData(iso: string) {
  return iso.split("-").reverse().join("/");
}

async function alunosAtivosDaTurma(turmaId: number) {
  const alunos = await getStudentsByTurma(turmaId, "nome");
  return alunos
    .filter((a) => a.matriculaStatus === "ATIVA")
    .sort((a, b) => a.studentName.localeCompare(b.studentName, "pt-BR"));
}

function PainelProfessor() {
  const [busca, setBusca] = useState("");
  const [secao, setSecao] = useState<SecaoId>("chamada");
  const [minhasTurmas, setMinhasTurmas] = useState<TurmaComDisciplinasDTO[] | null>(null);
  const [turmaId, setTurmaId] = useState<number | null>(null);
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
  // Cada professor leciona uma única disciplina (regra do LecionamentoService),
  // então a disciplina vem da turma escolhida e não é mais selecionada na tela.
  const disciplina: DisciplinaRef | null = turmaAtual?.disciplinas[0] ?? null;

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
      subtitulo={`${nomeProfessor ? `Prof. ${nomeProfessor} · ` : ""}Escolha a turma ao lado e registre a chamada, as notas e os recados.`}
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
        {turmaAtual && !disciplina && (
          <p className="text-base font-semibold text-destructive">
            Nenhuma disciplina associada a você nesta turma. Procure a secretaria da escola.
          </p>
        )}

        {turmaAtual && disciplina && secao === "chamada" && (
          <Chamada
            key={turmaAtual.turmaId}
            turmaId={turmaAtual.turmaId}
            turmaName={turmaAtual.turmaName}
            disciplina={disciplina}
          />
        )}
        {turmaAtual && disciplina && secao === "notas" && (
          <NotasDaTurma
            key={turmaAtual.turmaId}
            turmaId={turmaAtual.turmaId}
            turmaName={turmaAtual.turmaName}
            disciplina={disciplina}
          />
        )}
        {turmaAtual && secao === "recados" && <Recados turmaName={turmaAtual.turmaName} />}
      </PainelLateral>
    </AppShell>
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
  // Faltas já gravadas no dia escolhido, por aluno: base para marcar e para corrigir a chamada.
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
              Clique em uma nota para ver, editar ou lançar avaliações. A média geral de cada
              período é a média das médias das matérias.
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

function Recados({ turmaName }: { turmaName: string }) {
  const [recados, setRecados] = useState(recadosPublicados);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");

  function publicar() {
    if (!titulo.trim() || !corpo.trim()) {
      toast.error("Preencha o título e o texto do recado.");
      return;
    }
    setRecados([
      { titulo: titulo.trim(), turma: turmaName, quando: "Publicado agora", texto: corpo.trim() },
      ...recados,
    ]);
    setTitulo("");
    setCorpo("");
    toast.success(`Recado publicado para o ${turmaName}.`);
  }

  return (
    <Secao titulo="Recados e atividades" descricao={turmaName}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Novo recado ou atividade</CardTitle>
            <CardDescription className="text-base">
              O texto aparece no painel dos alunos e dos responsáveis da turma.
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
                placeholder="Explique a atividade, o prazo e o que precisa ser entregue."
                className="text-lg"
              />
            </div>
            <Button onClick={publicar} className="min-h-12 px-6 text-lg">
              Publicar para a turma
            </Button>
          </CardContent>
        </Card>

        <div>
          <h3 className="mb-4 font-display text-xl font-bold text-foreground">Já publicados</h3>
          <div className="grid gap-4">
            {recados.map((r, i) => (
              <Card key={`${r.titulo}-${i}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{r.titulo}</CardTitle>
                  <CardDescription className="text-base">
                    {r.turma} · {r.quando}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-base text-muted-foreground">{r.texto}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Secao>
  );
}
