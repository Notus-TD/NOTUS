import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { alunosPorTurma, recadosPublicados, turmas } from "@/data/notus";

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

  const [presentes, setPresentes] = useState<Record<string, boolean>>({});
  const [notas, setNotas] = useState<Record<string, string>>({});
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
    toast.success(`Chamada do ${turma} salva: ${totalPresentes} presentes, ${listaAlunos.length - totalPresentes} faltas.`);
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
                    <li key={nome} className="flex flex-wrap items-center justify-between gap-3 py-3">
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
