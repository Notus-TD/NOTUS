import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { alunosPorTurma, recadosPublicados, turmas } from "@/data/notus";
import {
  ApiError,
  createBoletim,
  createNota,
  deleteBoletim,
  deleteNota,
  getBoletinsByStudent,
  getDisciplinas,
  getNotasByBoletim,
  getStudents,
  updateNota,
  type Boletim,
  type DisciplinaDTO,
  type Nota,
  type StudentMinDTO,
} from "@/lib/api";
import { useCarga, MensagemErro } from "@/hooks/use-carga";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function PainelProfessor() {
  const [turma, setTurma] = useState<string>(turmas[0] ?? "");
  const listaAlunos: string[] = alunosPorTurma[turma] ?? [];

  const [presentes, setPresentes] = useState<Record<string, boolean>>({});
  const [recados, setRecados] = useState(recadosPublicados);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");

  const chaveTurma = (nome: string) => `${turma}::${nome}`;
  const totalPresentes = useMemo(
    () => listaAlunos.filter((n) => presentes[chaveTurma(n)] !== false).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listaAlunos, presentes, turma],
  );

  function salvarChamada() {
    toast.success(
      `Chamada do ${turma} salva: ${totalPresentes} presentes, ${listaAlunos.length - totalPresentes} faltas.`,
    );
  }

  function publicar() {
    if (!titulo.trim() || !corpo.trim()) {
      toast.error("Preencha o título e o texto do recado.");
      return;
    }
    setRecados([
      { titulo: titulo.trim(), turma, quando: "Publicado agora", texto: corpo.trim() },
      ...recados,
    ]);
    setTitulo("");
    setCorpo("");
    toast.success(`Recado publicado para o ${turma}.`);
  }

  return (
    <AppShell
      role="ROLE_PROFESSOR"
      titulo="Diário de classe"
      subtitulo="Prof. Rafael Duarte · Registre a chamada, lance as notas e publique recados para suas turmas."
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-lg font-semibold text-foreground">Turma:</span>
        {turmas.map((t) => (
          <Button
            key={t}
            variant={t === turma ? "default" : "outline"}
            className="min-h-11 text-base"
            onClick={() => setTurma(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="chamada">
        <TabsList className="h-auto flex-wrap gap-2 bg-secondary p-2">
          <TabsTrigger value="chamada" className="min-h-11 px-5 text-base">
            Chamada
          </TabsTrigger>
          <TabsTrigger value="notas" className="min-h-11 px-5 text-base">
            Notas
          </TabsTrigger>
          <TabsTrigger value="recados" className="min-h-11 px-5 text-base">
            Recados e atividades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chamada" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Presença de hoje — {turma}</CardTitle>
              <CardDescription className="text-base">
                Todos começam como presentes. Marque apenas quem faltou. {totalPresentes} de{" "}
                {listaAlunos.length} presentes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="divide-y divide-border">
                {listaAlunos.map((nome) => {
                  const presente = presentes[chaveTurma(nome)] !== false;
                  return (
                    <li
                      key={nome}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <span className="text-lg text-foreground">{nome}</span>
                      <div className="flex gap-2">
                        <Button
                          variant={presente ? "default" : "outline"}
                          className="min-h-11 min-w-28 text-base"
                          aria-pressed={presente}
                          onClick={() => setPresentes({ ...presentes, [chaveTurma(nome)]: true })}
                        >
                          Presente
                        </Button>
                        <Button
                          variant={presente ? "outline" : "destructive"}
                          className="min-h-11 min-w-28 text-base"
                          aria-pressed={!presente}
                          onClick={() => setPresentes({ ...presentes, [chaveTurma(nome)]: false })}
                        >
                          Faltou
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Button onClick={salvarChamada} className="min-h-12 px-6 text-lg">
                Salvar chamada
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notas" className="mt-6">
          <AbaNotas />
        </TabsContent>

        <TabsContent value="recados" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Novo recado ou atividade — {turma}</CardTitle>
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
            <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Já publicados</h2>
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
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function AbaNotas() {
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<StudentMinDTO | null>(null);
  const [versaoAlunos, setVersaoAlunos] = useState(0);
  const alunos = useCarga<StudentMinDTO[]>(getStudents, versaoAlunos);
  const disciplinas = useCarga<DisciplinaDTO[]>(getDisciplinas, 0);

  const termo = busca.trim().toLowerCase();
  const filtrados =
    alunos.estado === "ok"
      ? alunos.dados.filter(
          (a) =>
            !termo ||
            a.studentName.toLowerCase().includes(termo) ||
            String(a.matricula).includes(termo),
        )
      : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-xl">Selecionar aluno</CardTitle>
            <CardDescription className="text-base">
              Escolha um aluno para lançar ou editar as notas dele.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            className="min-h-10 text-base"
            onClick={() => setVersaoAlunos((v) => v + 1)}
            disabled={alunos.estado === "carregando"}
          >
            <RefreshCw
              className={`size-5 ${alunos.estado === "carregando" ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou matrícula…"
              aria-label="Buscar aluno"
              className="h-12 pl-10 text-lg"
            />
          </div>

          {alunos.estado === "carregando" && (
            <p className="text-base text-muted-foreground">Carregando…</p>
          )}
          {alunos.estado === "erro" && <MensagemErro carga={alunos} />}
          {alunos.estado === "ok" && (
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
                    <span className="text-base text-muted-foreground">Matrícula {a.matricula}</span>
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

      {selecionado && disciplinas.estado === "ok" && (
        <BoletinsDoAluno
          key={selecionado.userId}
          aluno={selecionado}
          disciplinas={disciplinas.dados}
        />
      )}
      {selecionado && disciplinas.estado === "carregando" && (
        <p className="text-base text-muted-foreground">Carregando matérias…</p>
      )}
      {selecionado && disciplinas.estado === "erro" && <MensagemErro carga={disciplinas} />}
    </div>
  );
}

function BoletinsDoAluno({
  aluno,
  disciplinas,
}: {
  aluno: StudentMinDTO;
  disciplinas: DisciplinaDTO[];
}) {
  const [versao, setVersao] = useState(0);
  const boletins = useCarga(() => getBoletinsByStudent(aluno.userId), versao);
  const [periodo, setPeriodo] = useState("");
  const [status, setStatus] = useState("EM ANDAMENTO");
  const [criando, setCriando] = useState(false);

  function atualizarBoletins() {
    setVersao((v) => v + 1);
  }

  async function criarBoletim(e: FormEvent) {
    e.preventDefault();
    if (!periodo.trim()) {
      toast.error("Informe o período do boletim.");
      return;
    }
    setCriando(true);
    try {
      await createBoletim({
        period: periodo.trim(),
        finalAverage: 0,
        status: status.trim() || "EM ANDAMENTO",
        studentId: aluno.userId,
      });
      setPeriodo("");
      setStatus("EM ANDAMENTO");
      atualizarBoletins();
      toast.success("Boletim criado.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar boletim.");
    } finally {
      setCriando(false);
    }
  }

  async function apagarBoletim(id: number) {
    try {
      await deleteBoletim(id);
      setVersao((v) => v + 1);
      toast.success("Boletim removido.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover boletim.");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Boletins de {aluno.studentName}</CardTitle>
          <CardDescription className="text-base">
            Cada boletim pode ter notas de várias matérias. A média final é a média das médias de
            cada matéria — lançar mais notas numa matéria não pesa mais que as outras.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={criarBoletim} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label htmlFor="novo-periodo" className="block text-sm font-semibold text-foreground">
                Período
              </label>
              <Input
                id="novo-periodo"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                placeholder="Ex.: 2º Bimestre"
                className="h-11 w-48 text-base"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="novo-status" className="block text-sm font-semibold text-foreground">
                Status
              </label>
              <Input
                id="novo-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-40 text-base"
              />
            </div>
            <Button type="submit" disabled={criando} className="min-h-11 text-base">
              {criando ? "Criando..." : "Novo boletim"}
            </Button>
          </form>

          {boletins.estado === "carregando" && (
            <p className="text-base text-muted-foreground">Carregando…</p>
          )}
          {boletins.estado === "erro" && <MensagemErro carga={boletins} />}
          {boletins.estado === "ok" && boletins.dados.length === 0 && (
            <p className="text-base text-muted-foreground">Nenhum boletim para este aluno ainda.</p>
          )}
        </CardContent>
      </Card>

      {boletins.estado === "ok" &&
        boletins.dados.map((b) => (
          <NotasDoBoletim
            key={b.id}
            boletim={b}
            disciplinas={disciplinas}
            onApagarBoletim={() => apagarBoletim(b.id)}
            onNotasAlteradas={atualizarBoletins}
          />
        ))}
    </div>
  );
}

function media(valores: number[]) {
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function NotasDoBoletim({
  boletim,
  disciplinas,
  onApagarBoletim,
  onNotasAlteradas,
}: {
  boletim: Boletim;
  disciplinas: DisciplinaDTO[];
  onApagarBoletim: () => void;
  onNotasAlteradas: () => void;
}) {
  const [versao, setVersao] = useState(0);
  const notas = useCarga(() => getNotasByBoletim(boletim.id), versao);
  const [disciplinaId, setDisciplinaId] = useState<string>(String(disciplinas[0]?.id ?? ""));
  const [rate, setRate] = useState("");
  const [period, setPeriod] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  const grupos =
    notas.estado === "ok"
      ? Object.values(
          notas.dados.reduce<Record<number, { disciplina: Nota["disciplina"]; notas: Nota[] }>>(
            (acc, n) => {
              const grupo = (acc[n.disciplina.id] ??= { disciplina: n.disciplina, notas: [] });
              grupo.notas.push(n);
              return acc;
            },
            {},
          ),
        )
      : [];

  function editar(n: Nota) {
    setEditandoId(n.id);
    setRate(String(n.rate));
    setPeriod(n.period);
    setDisciplinaId(String(n.disciplina.id));
  }

  function cancelar() {
    setEditandoId(null);
    setRate("");
    setPeriod("");
    setDisciplinaId(String(disciplinas[0]?.id ?? ""));
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const valor = Number(rate.replace(",", "."));
    if (!period.trim() || Number.isNaN(valor) || !disciplinaId) {
      toast.error("Informe a matéria, o período/avaliação e uma nota válida.");
      return;
    }
    setSalvando(true);
    try {
      const dto = {
        rate: valor,
        period: period.trim(),
        boletimId: boletim.id,
        disciplinaId: Number(disciplinaId),
      };
      if (editandoId) {
        await updateNota(editandoId, dto);
        toast.success("Nota atualizada.");
      } else {
        await createNota(dto);
        toast.success("Nota lançada.");
      }
      cancelar();
      setVersao((v) => v + 1);
      onNotasAlteradas();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar a nota.");
    } finally {
      setSalvando(false);
    }
  }

  async function apagar(id: number) {
    try {
      await deleteNota(id);
      toast.success("Nota removida.");
      setVersao((v) => v + 1);
      onNotasAlteradas();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover a nota.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-lg">{boletim.period}</CardTitle>
          <CardDescription className="text-base">
            Média final: {boletim.finalAverage.toFixed(1)} · {boletim.status}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          className="min-h-10 text-base text-destructive"
          onClick={onApagarBoletim}
        >
          Apagar boletim
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {notas.estado === "carregando" && (
          <p className="text-base text-muted-foreground">Carregando…</p>
        )}
        {notas.estado === "erro" && <MensagemErro carga={notas} />}
        {notas.estado === "ok" && grupos.length === 0 && (
          <p className="text-base text-muted-foreground">Nenhuma nota lançada neste boletim.</p>
        )}
        {notas.estado === "ok" && grupos.length > 0 && (
          <div className="space-y-5">
            {grupos.map((grupo) => (
              <div key={grupo.disciplina.id} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">
                    {grupo.disciplina.title}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    Média da matéria: {media(grupo.notas.map((n) => n.rate)).toFixed(1)}
                  </span>
                </div>
                <ul className="divide-y divide-border">
                  {grupo.notas.map((n) => (
                    <li
                      key={n.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <span className="text-lg text-foreground">
                        {n.period}: <strong>{n.rate}</strong>
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="min-h-10 text-base"
                          onClick={() => editar(n)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          className="min-h-10 text-base text-destructive"
                          onClick={() => apagar(n.id)}
                        >
                          Apagar
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={salvar}
          className="flex flex-wrap items-end gap-3 border-t border-border pt-4"
        >
          <div className="space-y-1">
            <label
              htmlFor={`disciplina-${boletim.id}`}
              className="block text-sm font-semibold text-foreground"
            >
              Matéria
            </label>
            <Select value={disciplinaId} onValueChange={setDisciplinaId}>
              <SelectTrigger id={`disciplina-${boletim.id}`} className="h-11 w-44 text-base">
                <SelectValue placeholder="Matéria" />
              </SelectTrigger>
              <SelectContent>
                {disciplinas.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label
              htmlFor={`periodo-${boletim.id}`}
              className="block text-sm font-semibold text-foreground"
            >
              Período/avaliação
            </label>
            <Input
              id={`periodo-${boletim.id}`}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Ex.: Prova bimestral"
              className="h-11 w-56 text-base"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor={`rate-${boletim.id}`}
              className="block text-sm font-semibold text-foreground"
            >
              Nota
            </label>
            <Input
              id={`rate-${boletim.id}`}
              type="number"
              min={0}
              max={10}
              step={0.1}
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="h-11 w-24 text-base"
            />
          </div>
          <Button type="submit" disabled={salvando} className="min-h-11 text-base">
            {editandoId ? "Salvar edição" : "Lançar nota"}
          </Button>
          {editandoId && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 text-base"
              onClick={cancelar}
            >
              Cancelar
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
