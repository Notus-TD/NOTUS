import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { aluno, atividades, horarios, notasRecentes, presenca, media } from "@/data/notus";
import { getFaltas, login, type FaltaDTO } from "@/lib/api";

export const Route = createFileRoute("/aluno")({
  head: () => ({
    meta: [
      { title: "Painel do Aluno · NOTUS" },
      {
        name: "description",
        content: "Atividades com prazo, notas recentes, quadro de horários e presença por disciplina.",
      },
      { property: "og:title", content: "Painel do Aluno · NOTUS" },
      {
        property: "og:description",
        content: "Veja o que entregar, suas notas, seus horários e sua frequência em cada disciplina.",
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

function PainelAluno() {
  const mediaGeral = media(notasRecentes.map((n) => n.nota));

  const [faltas, setFaltas] = useState<FaltaDTO[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function testarIntegracaoBackend() {
    setCarregando(true);
    setErro(null);
    try {
      await login("ana.aluna@gmail.com", "123456");
      const dados = await getFaltas();
      setFaltas(dados);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AppShell
      titulo={`Olá, ${aluno.nome.split(" ")[0]}!`}
      subtitulo={`${aluno.turma} · Aqui está o seu resumo da semana: o que entregar, suas notas, seus horários e sua presença.`}
    >
      <Card className="border-2 border-dashed border-primary/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Teste de integração — backend NOTUS</CardTitle>
          <CardDescription className="text-base">
            Faz login como Ana Aluna e busca as faltas reais em{" "}
            <code>GET http://localhost:8081/falta</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testarIntegracaoBackend} disabled={carregando} className="min-h-11 text-base">
            {carregando ? "Buscando..." : "Buscar faltas do backend"}
          </Button>
          {erro && <p className="text-base font-semibold text-destructive">{erro}</p>}
          {faltas && (
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-base">Para entregar</CardDescription>
            <CardTitle className="font-display text-3xl">
              {atividades.filter((a) => a.situacao !== "entregue").length} atividades
            </CardTitle>
          </CardHeader>
          <CardContent className="text-base text-muted-foreground">1 delas é para hoje</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-base">Média das últimas notas</CardDescription>
            <CardTitle className="font-display text-3xl">{mediaGeral.toFixed(1)}</CardTitle>
          </CardHeader>
          <CardContent className="text-base text-muted-foreground">Continue assim!</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-base">Presença geral</CardDescription>
            <CardTitle className="font-display text-3xl">
              {Math.round(
                (1 -
                  presenca.reduce((s, p) => s + p.faltas, 0) /
                    presenca.reduce((s, p) => s + p.aulas, 0)) *
                  100,
              )}
              %
            </CardTitle>
          </CardHeader>
          <CardContent className="text-base text-muted-foreground">Precisa ter no mínimo 75%</CardContent>
        </Card>
      </div>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Minhas atividades</h2>
        <div className="grid gap-4">
          {atividades.map((a) => {
            const info = situacaoInfo[a.situacao];
            return (
              <Card key={a.titulo}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{a.titulo}</CardTitle>
                      <CardDescription className="mt-1 text-base">
                        {a.disciplina} · {a.prazo}
                      </CardDescription>
                    </div>
                    <Badge className={`${info.classe} px-3 py-1 text-sm font-semibold`}>{info.texto}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-base text-muted-foreground">{a.descricao}</CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Notas recentes</h2>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {notasRecentes.map((n) => (
                <div key={n.disciplina} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{n.disciplina}</p>
                    <p className="text-base text-muted-foreground">{n.avaliacao}</p>
                  </div>
                  <span
                    className={`rounded-xl px-4 py-2 font-display text-2xl font-bold ${
                      n.nota >= 7
                        ? "bg-success text-success-foreground"
                        : n.nota >= 6
                          ? "bg-warning text-warning-foreground"
                          : "bg-destructive text-destructive-foreground"
                    }`}
                  >
                    {n.nota.toFixed(1)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Presença por disciplina</h2>
          <Card>
            <CardContent className="space-y-5 p-6">
              {presenca.map((p) => {
                const pct = Math.round((1 - p.faltas / p.aulas) * 100);
                return (
                  <div key={p.disciplina}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-lg font-semibold text-foreground">{p.disciplina}</span>
                      <span className="text-base text-muted-foreground">
                        {p.faltas} {p.faltas === 1 ? "falta" : "faltas"} · {pct}%
                      </span>
                    </div>
                    <Progress value={pct} className="mt-2 h-3" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Quadro de horários</h2>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <caption className="sr-only">Horário semanal de aulas</caption>
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th scope="col" className="px-4 py-3 text-base font-semibold text-secondary-foreground">
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
      </section>
    </AppShell>
  );
}
