import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { alunosPorTurma, recadosPublicados, turmas } from "@/data/notus";
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

export const Route = createFileRoute("/professor")({
  head: () => ({
    meta: [
      { title: "Painel do Professor · NOTUS" },
      {
        name: "description",
        content: "Diário de classe simplificado: chamada, lançamento de notas e recados para as turmas.",
      },
      { property: "og:title", content: "Painel do Professor · NOTUS" },
      {
        property: "og:description",
        content: "Faça a chamada, lance notas e publique atividades para suas turmas em poucos toques.",
      },
    ],
  }),
  component: PainelProfessor,
});

function PainelProfessor() {
  const [turma, setTurma] = useState<string>(turmas[0] ?? "");
  const listaAlunos: string[] = alunosPorTurma[turma] ?? [];

  const [notas, setNotas] = useState<Record<string, string>>({});
  const [recados, setRecados] = useState(recadosPublicados);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");

  const chaveTurma = (nome: string) => `${turma}::${nome}`;

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
      .catch((e) => ativo && setErroCarregamento(e instanceof ApiError ? e.message : "Erro ao carregar alunos e disciplinas."));
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

  const nomeDoAluno = (id: number) => alunosReais?.find((a) => a.userId === id)?.studentName ?? `Aluno ${id}`;

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

  function salvarNotas() {
    const lancadas = listaAlunos.filter((n) => notas[chaveTurma(n)]?.trim()).length;
    if (!lancadas) {
      toast.error("Nenhuma nota preenchida ainda.");
      return;
    }
    toast.success(`${lancadas} notas lançadas para o ${turma}.`);
  }

  function publicar() {
    if (!titulo.trim() || !corpo.trim()) {
      toast.error("Preencha o título e o texto do recado.");
      return;
    }
    setRecados([{ titulo: titulo.trim(), turma, quando: "Publicado agora", texto: corpo.trim() }, ...recados]);
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
              <CardTitle className="text-xl">Registrar faltas (backend real)</CardTitle>
              <CardDescription className="text-base">
                Lista de alunos ativos e disciplinas vindas do servidor. Marcar "Faltou" e salvar cria a falta de
                verdade via <code>POST /falta/associar</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {erroCarregamento && <p className="text-base font-semibold text-destructive">{erroCarregamento}</p>}

              {!erroCarregamento && (alunosReais === null || disciplinas === null) && (
                <p className="text-base text-muted-foreground">Carregando alunos e disciplinas…</p>
              )}

              {alunosReais && disciplinas && (
                <>
                  <div className="max-w-xs space-y-2">
                    <label className="block text-lg font-semibold text-foreground">Disciplina</label>
                    <Select
                      value={disciplinaId ? String(disciplinaId) : undefined}
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
                        <li key={a.userId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                          <span className="text-lg text-foreground">
                            {a.studentName} <span className="text-base text-muted-foreground">· matr. {a.matricula}</span>
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

                  <Button onClick={salvarChamadaReal} disabled={salvandoChamada} className="min-h-12 px-6 text-lg">
                    {salvandoChamada ? "Salvando..." : "Salvar chamada no backend"}
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
                  {faltasDaDisciplina.length} registro(s). Pode excluir uma falta lançada por engano.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {faltasDaDisciplina.map((f) => (
                    <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Lançamento de notas — {turma}</CardTitle>
              <CardDescription className="text-base">
                Notas de 0 a 10, com uma casa decimal. Prova bimestral do 3º bimestre.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="divide-y divide-border">
                {listaAlunos.map((nome) => (
                  <li key={nome} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <label htmlFor={`nota-${nome}`} className="text-lg text-foreground">
                      {nome}
                    </label>
                    <Input
                      id={`nota-${nome}`}
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      inputMode="decimal"
                      placeholder="—"
                      value={notas[chaveTurma(nome)] ?? ""}
                      onChange={(e) => setNotas({ ...notas, [chaveTurma(nome)]: e.target.value })}
                      className="h-12 w-28 text-center text-lg"
                    />
                  </li>
                ))}
              </ul>
              <Button onClick={salvarNotas} className="min-h-12 px-6 text-lg">
                Salvar notas
              </Button>
            </CardContent>
          </Card>
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
