import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Search,
  UserX,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { aluno, atividades, horarios, notasRecentes, presenca, media } from "@/data/notus";
import { getFaltas, type FaltaDTO } from "@/lib/api";

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

type SecaoId = "hoje" | "atrasadas" | "atividades" | "notas" | "presenca" | "semana" | "faltas";

const secoes: { id: SecaoId; label: string; descricao: string; icon: typeof Search; termos: string }[] = [
  { id: "hoje", label: "Aulas de hoje", descricao: "Grade horária do dia", icon: CalendarClock, termos: "grade horario aula hoje dia" },
  { id: "atrasadas", label: "Atividades em atraso", descricao: "Prazos que já venceram", icon: AlertTriangle, termos: "atraso atrasada pendente vencida entrega" },
  { id: "atividades", label: "Todas as atividades", descricao: "Tudo o que há para entregar", icon: ClipboardList, termos: "atividade tarefa trabalho entregar lista" },
  { id: "notas", label: "Notas recentes", descricao: "Últimas avaliações", icon: BarChart3, termos: "nota prova media avaliacao boletim" },
  { id: "presenca", label: "Presença por disciplina", descricao: "Frequência em cada matéria", icon: UserX, termos: "presenca falta frequencia" },
  { id: "semana", label: "Quadro semanal", descricao: "Horários de segunda a sexta", icon: CalendarDays, termos: "semana horario quadro grade" },
  { id: "faltas", label: "Faltas registradas", descricao: "Registros oficiais do backend", icon: UserX, termos: "falta registro backend oficial" },
];

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function diaDeHoje() {
  const idx = new Date().getDay() - 1; // 0 = segunda ... 4 = sexta
  const util = idx >= 0 && idx <= 4;
  return { idx: util ? idx : 0, util };
}

function PainelAluno() {
  const [busca, setBusca] = useState("");
  const [secao, setSecao] = useState<SecaoId>("hoje");

  const atrasadas = atividades.filter((a) => a.situacao === "atrasada");

  const secoesFiltradas = useMemo(() => {
    const q = normalizar(busca.trim());
    if (!q) return secoes;
    return secoes.filter((s) => normalizar(`${s.label} ${s.descricao} ${s.termos}`).includes(q));
  }, [busca]);

  const atividadesEncontradas = useMemo(() => {
    const q = normalizar(busca.trim());
    if (q.length < 2) return [];
    return atividades.filter((a) => normalizar(`${a.titulo} ${a.disciplina} ${a.descricao}`).includes(q));
  }, [busca]);

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && secoesFiltradas[0]) {
      setSecao(secoesFiltradas[0].id);
      setBusca("");
    }
    if (e.key === "Escape") setBusca("");
  }

  return (
    <AppShell
      role="ROLE_ALUNO"
      titulo={`Olá, ${aluno.nome.split(" ")[0]}!`}
      subtitulo={`${aluno.turma} · Use a busca ao lado para encontrar o que precisa.`}
    >
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  aria-label="Pesquisar no painel"
                  placeholder="Pesquisar... (ex.: atraso, notas)"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={aoTeclar}
                  className="h-12 pl-10 text-base"
                />
              </div>

              <nav aria-label="Seções do painel" className="space-y-1">
                {secoesFiltradas.length === 0 && (
                  <p className="px-3 py-2 text-base text-muted-foreground">Nada encontrado para "{busca}".</p>
                )}
                {secoesFiltradas.map((s) => {
                  const ativa = s.id === secao;
                  const contador = s.id === "atrasadas" ? atrasadas.length : undefined;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-current={ativa ? "page" : undefined}
                      onClick={() => {
                        setSecao(s.id);
                        setBusca("");
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                        ativa ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                    >
                      <s.icon className="size-5 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-semibold">{s.label}</span>
                        <span className={`block truncate text-sm ${ativa ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {s.descricao}
                        </span>
                      </span>
                      {contador !== undefined && contador > 0 && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-sm font-bold ${
                            ativa ? "bg-primary-foreground/20" : "bg-destructive text-destructive-foreground"
                          }`}
                        >
                          {contador}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0 space-y-6">
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
            <Secao titulo="Atividades em atraso" descricao={atrasadas.length ? `${atrasadas.length} com prazo vencido` : "Nenhuma atividade atrasada. Parabéns!"}>
              <ListaAtividades itens={atrasadas} />
            </Secao>
          )}
          {secao === "atividades" && (
            <Secao titulo="Todas as atividades" descricao={`${atividades.filter((a) => a.situacao !== "entregue").length} para entregar`}>
              <ListaAtividades itens={atividades} />
            </Secao>
          )}
          {secao === "notas" && <Notas />}
          {secao === "presenca" && <Presenca />}
          {secao === "semana" && <QuadroSemanal />}
          {secao === "faltas" && <FaltasBackend />}
        </section>
      </div>
    </AppShell>
  );
}

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground">{titulo}</h2>
      {descricao && <p className="mt-1 text-base text-muted-foreground">{descricao}</p>}
      <div className="mt-4">{children}</div>
    </div>
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
      descricao={hoje.util ? `${horarios.aulas.length} aulas, começando às ${horarios.aulas[0]?.hora}` : `Fim de semana. Veja como começa a ${nomeDia?.toLowerCase()}:`}
    >
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {horarios.aulas.map((a) => (
            <div key={a.hora} className="flex items-center gap-4 px-6 py-4">
              <span className="w-20 shrink-0 font-display text-xl font-bold text-primary">{a.hora}</span>
              <span className="text-lg text-foreground">{a.grade[hoje.idx]}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </Secao>
  );
}

function ListaAtividades({ itens }: { itens: typeof atividades }) {
  if (itens.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-base text-muted-foreground">Nenhuma atividade aqui.</CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-4">
      {itens.map((a) => {
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
  );
}

function Notas() {
  const mediaGeral = media(notasRecentes.map((n) => n.nota));
  return (
    <Secao titulo="Notas recentes" descricao={`Média das últimas avaliações: ${mediaGeral.toFixed(1)}`}>
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
    </Secao>
  );
}

function Presenca() {
  const geral = Math.round(
    (1 - presenca.reduce((s, p) => s + p.faltas, 0) / presenca.reduce((s, p) => s + p.aulas, 0)) * 100,
  );
  return (
    <Secao titulo="Presença por disciplina" descricao={`Presença geral: ${geral}% · mínimo exigido 75%`}>
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
                <th scope="col" className="px-4 py-3 text-base font-semibold text-secondary-foreground">
                  Hora
                </th>
                {horarios.dias.map((d) => (
                  <th key={d} scope="col" className="px-4 py-3 text-base font-semibold text-secondary-foreground">
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
      setFaltas(await getFaltas());
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Secao titulo="Faltas registradas" descricao="Registros oficiais vindos do backend (GET /falta) com o seu login.">
      <Card>
        <CardContent className="space-y-4 p-6">
          <Button onClick={buscar} disabled={carregando} className="min-h-11 text-base">
            {carregando ? "Buscando..." : "Buscar faltas"}
          </Button>
          {erro && <p className="text-base font-semibold text-destructive">{erro}</p>}
          {faltas && faltas.length === 0 && <p className="text-base text-muted-foreground">Nenhuma falta registrada.</p>}
          {faltas && faltas.length > 0 && (
            <ul className="divide-y divide-border text-base">
              {faltas.map((f) => (
                <li key={f.id} className="py-2">
                  Falta #{f.id} — disciplina {f.disciplinaId}, {f.quantidade} {f.quantidade === 1 ? "falta" : "faltas"} em {f.data}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </Secao>
  );
}
