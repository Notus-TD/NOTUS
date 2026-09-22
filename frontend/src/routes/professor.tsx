import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BoletimMatriz } from "@/components/BoletimMatriz";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { recadosPublicados, turmas } from "@/data/notus";
import {
  ApiError,
  associarFalta,
  deleteFalta,
  getDisciplinas,
  getFaltas,
  getStudents,
  registrarAula,
  type DisciplinaDTO,
  type FaltaDTO,
  type StudentMinDTO,
} from "@/lib/api";
import { useCarga, MensagemErro } from "@/hooks/use-carga";

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

  const [recados, setRecados] = useState(recadosPublicados);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");

  const [alunosReais, setAlunosReais] = useState<StudentMinDTO[] | null>(null);
  const [disciplinas, setDisciplinas] = useState<DisciplinaDTO[] | null>(null);
  const [disciplinaId, setDisciplinaId] = useState<number | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [faltosos, setFaltosos] = useState<Record<number, boolean>>({});
  const [salvandoChamada, setSalvandoChamada] = useState(false);
  const [faltasDaDisciplina, setFaltasDaDisciplina] = useState<FaltaDTO[] | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([getStudents(), getDisciplinas()])
      .then(([alunos, discs]) => {
        if (!ativo) return;
        setAlunosReais(alunos.filter((a) => a.matriculaStatus === "ATIVA"));
        setDisciplinas(discs);
        setDisciplinaId((atual) => atual ?? discs[0]?.id ?? null);
      })
      .catch(
        (e) =>
          ativo &&
          setErroCarregamento(
            e instanceof ApiError ? e.message : "Erro ao carregar alunos e disciplinas.",
          ),
      );
    return () => {
      ativo = false;
    };
  }, []);

  async function recarregarFaltasDaDisciplina(discId: number) {
    try {
      const todas = await getFaltas();
      setFaltasDaDisciplina(todas.filter((f) => f.disciplinaId === discId));
    } catch {
      setFaltasDaDisciplina(null);
    }
  }

  useEffect(() => {
    if (disciplinaId != null) void recarregarFaltasDaDisciplina(disciplinaId);
  }, [disciplinaId]);

  const nomeDoAluno = (id: number) =>
    alunosReais?.find((a) => a.userId === id)?.studentName ?? `Aluno ${id}`;

  async function salvarChamadaReal() {
    if (!disciplinaId) {
      toast.error("Selecione uma disciplina.");
      return;
    }

    setSalvandoChamada(true);
    const hoje = new Date().toISOString().slice(0, 10);

    try {
      await registrarAula(disciplinaId, hoje);
    } catch (e) {
      setSalvandoChamada(false);
      toast.error(e instanceof ApiError ? e.message : "Erro ao registrar a aula do dia.");
      return;
    }

    const idsFaltantes = Object.entries(faltosos)
      .filter(([, faltou]) => faltou)
      .map(([id]) => Number(id));

    let sucesso = 0;
    let primeiroErro: string | null = null;
    for (const studentId of idsFaltantes) {
      try {
        await associarFalta({ data: hoje, quantidade: 1, studentId, disciplinaId });
        sucesso++;
      } catch (e) {
        primeiroErro ??= e instanceof ApiError ? e.message : "Erro desconhecido.";
      }
    }
    setSalvandoChamada(false);
    setFaltosos({});
    if (idsFaltantes.length === 0) toast.success("Aula registrada — todos presentes.");
    else if (sucesso) toast.success(`Aula registrada. ${sucesso} falta(s) lançada(s).`);
    if (primeiroErro) toast.error(`Falha ao registrar algumas faltas: ${primeiroErro}`);
    void recarregarFaltasDaDisciplina(disciplinaId);
  }

  async function excluirFalta(id: number) {
    try {
      await deleteFalta(id);
      toast.success("Falta removida.");
      if (disciplinaId != null) void recarregarFaltasDaDisciplina(disciplinaId);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao remover a falta.");
    }
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

        <TabsContent value="chamada" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Registrar faltas</CardTitle>
              <CardDescription className="text-base">
                Lista de alunos ativos da disciplina selecionada. Marque "Faltou" nos alunos
                ausentes e salve a chamada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {erroCarregamento && (
                <p className="text-base font-semibold text-destructive">{erroCarregamento}</p>
              )}

              {!erroCarregamento && (alunosReais === null || disciplinas === null) && (
                <p className="text-base text-muted-foreground">Carregando alunos e disciplinas…</p>
              )}

              {alunosReais && disciplinas && (
                <>
                  <div className="max-w-xs space-y-2">
                    <label className="block text-lg font-semibold text-foreground">
                      Disciplina
                    </label>
                    <Select
                      value={disciplinaId ? String(disciplinaId) : ""}
                      onValueChange={(v) => setDisciplinaId(Number(v))}
                    >
                      <SelectTrigger className="h-12 text-lg">
                        <SelectValue placeholder="Selecione a disciplina" />
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

                  <ul className="divide-y divide-border">
                    {alunosReais.map((a) => {
                      const faltou = faltosos[a.userId] === true;
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
                              variant={!faltou ? "default" : "outline"}
                              className="min-h-11 min-w-28 text-base"
                              aria-pressed={!faltou}
                              onClick={() => setFaltosos({ ...faltosos, [a.userId]: false })}
                            >
                              Presente
                            </Button>
                            <Button
                              variant={faltou ? "destructive" : "outline"}
                              className="min-h-11 min-w-28 text-base"
                              aria-pressed={faltou}
                              onClick={() => setFaltosos({ ...faltosos, [a.userId]: true })}
                            >
                              Faltou
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <Button
                    onClick={salvarChamadaReal}
                    disabled={salvandoChamada}
                    className="min-h-12 px-6 text-lg"
                  >
                    {salvandoChamada ? "Salvando..." : "Salvar chamada"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {faltasDaDisciplina && faltasDaDisciplina.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Faltas já registradas nesta disciplina</CardTitle>
                <CardDescription className="text-base">
                  {faltasDaDisciplina.length} registro(s). Pode excluir uma falta lançada por
                  engano.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {faltasDaDisciplina.map((f) => (
                    <li
                      key={f.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <span className="text-lg text-foreground">
                        {nomeDoAluno(f.studentId)}{" "}
                        <Badge className="ml-2 bg-secondary text-sm font-semibold text-secondary-foreground">
                          {f.data} · {f.quantidade} {f.quantidade === 1 ? "falta" : "faltas"}
                        </Badge>
                      </span>
                      <Button
                        variant="outline"
                        className="min-h-10 text-base text-destructive hover:text-destructive"
                        onClick={() => excluirFalta(f.id)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Excluir
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
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
        <div key={selecionado.userId} className="space-y-3">
          <h3 className="font-display text-xl font-bold text-foreground">
            Boletim de {selecionado.studentName}
          </h3>
          <BoletimMatriz
            studentId={selecionado.userId}
            editable
            disciplinasDisponiveis={disciplinas.dados}
          />
        </div>
      )}
      {selecionado && disciplinas.estado === "carregando" && (
        <p className="text-base text-muted-foreground">Carregando matérias…</p>
      )}
      {selecionado && disciplinas.estado === "erro" && <MensagemErro carga={disciplinas} />}
    </div>
  );
}

