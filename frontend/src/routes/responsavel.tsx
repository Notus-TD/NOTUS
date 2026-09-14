import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { aluno, avisos, conversas, media } from "@/data/notus";
import {
  ApiError,
  getBoletinsByStudent,
  getMeuPerfil,
  getMinhaFrequencia,
  getNotasByBoletim,
  getStudentsByResponsible,
  type Boletim,
  type FrequenciaDTO,
  type MeuPerfilDTO,
  type Nota,
  type StudentMinDTO,
} from "@/lib/api";
import { getSession } from "@/lib/auth";
import { useCarga, MensagemErro } from "@/hooks/use-carga";

export const Route = createFileRoute("/responsavel")({
  head: () => ({
    meta: [
      { title: "Painel do Responsável · NOTUS" },
      {
        name: "description",
        content:
          "Avisos da escola, boletim completo, controle de faltas e conversa direta com a coordenação e os professores.",
      },
      { property: "og:title", content: "Painel do Responsável · NOTUS" },
      {
        property: "og:description",
        content:
          "Acompanhe notas, faltas e comunicados da escola em letras grandes e linguagem clara.",
      },
    ],
  }),
  component: PainelResponsavel,
});

function PainelResponsavel() {
  const [lidos, setLidos] = useState<string[]>([]);
  const [mensagens, setMensagens] = useState(conversas);
  const [texto, setTexto] = useState("");

  const [perfil, setPerfil] = useState<MeuPerfilDTO | null>(null);

  useEffect(() => {
    let ativo = true;
    getMeuPerfil()
      .then((p) => ativo && setPerfil(p))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const [frequencia, setFrequencia] = useState<FrequenciaDTO[] | null>(null);
  const [carregandoFrequencia, setCarregandoFrequencia] = useState(false);
  const [erroFrequencia, setErroFrequencia] = useState<string | null>(null);

  async function buscarFrequencia() {
    setCarregandoFrequencia(true);
    setErroFrequencia(null);
    try {
      setFrequencia(await getMinhaFrequencia());
    } catch (e) {
      setErroFrequencia(e instanceof ApiError ? e.message : "Erro ao carregar as faltas.");
    } finally {
      setCarregandoFrequencia(false);
    }
  }

  useEffect(() => {
    void buscarFrequencia();
  }, []);

  function enviar() {
    if (!texto.trim()) return;
    setMensagens([...mensagens, { de: "Você", quando: "Agora", texto: texto.trim(), meu: true }]);
    setTexto("");
    toast.success("Mensagem enviada para a coordenação.");
  }

  return (
    <AppShell
      role="ROLE_RESPONSAVEL"
      titulo={`Boa tarde, ${perfil?.nome ?? "..."}`}
      subtitulo={`Acompanhamento de ${perfil?.dependentes[0]?.nome ?? "..."} — ${aluno.turma}. Avisos da escola, boletim, faltas e conversa com a equipe.`}
    >
      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-foreground">
          Avisos e notificações
        </h2>
        <div className="grid gap-4">
          {avisos.map((a) => {
            const naoLido = a.naoLido && !lidos.includes(a.titulo);
            return (
              <Card key={a.titulo} className={naoLido ? "border-2 border-primary" : undefined}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{a.titulo}</CardTitle>
                      <CardDescription className="mt-1 text-base">
                        {a.origem} · {a.data}
                      </CardDescription>
                    </div>
                    {naoLido && (
                      <Badge className="bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                        Novo
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg leading-relaxed text-foreground">{a.texto}</p>
                  {naoLido && (
                    <Button
                      variant="outline"
                      className="min-h-11 text-base"
                      onClick={() => setLidos([...lidos, a.titulo])}
                    >
                      Marcar como lido
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Boletim completo</h2>
        <BoletimCompleto />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-foreground">Controle de faltas</h2>
          <Button
            onClick={buscarFrequencia}
            disabled={carregandoFrequencia}
            variant="outline"
            className="min-h-11 text-base"
          >
            {carregandoFrequencia ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
        {erroFrequencia && (
          <p className="text-base font-semibold text-destructive">{erroFrequencia}</p>
        )}
        {!erroFrequencia && frequencia === null && (
          <p className="text-base text-muted-foreground">Carregando…</p>
        )}
        {frequencia && frequencia.length === 0 && (
          <p className="text-base text-muted-foreground">
            Nenhuma aula registrada ainda pelo professor — as faltas aparecem aqui assim que a
            chamada começar.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {frequencia?.map((f) => {
            const limite = Math.floor(f.totalAulas * 0.25);
            const alerta = f.totalFaltas >= limite && limite > 0;
            return (
              <Card
                key={`${f.studentId}-${f.disciplinaId}`}
                className={alerta ? "border-2 border-warning" : undefined}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{f.disciplinaTitle}</CardTitle>
                  <CardDescription className="text-base">
                    {f.totalFaltas} de {f.totalAulas} aulas perdidas ·{" "}
                    {Math.round(f.percentualPresenca)}% de presença
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-base">
                  {alerta ? (
                    <p className="font-semibold text-warning">
                      Atenção: o limite é de {limite} faltas nesta disciplina.
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Dentro do limite permitido ({limite} faltas).
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Falar com a escola</h2>
        <Card>
          <CardContent className="space-y-5 p-6">
            <ul className="space-y-4">
              {mensagens.map((m, i) => (
                <li
                  key={i}
                  className={`max-w-2xl rounded-2xl p-4 ${
                    m.meu
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="text-base font-semibold">
                    {m.de} · <span className="font-normal opacity-80">{m.quando}</span>
                  </p>
                  <p className="mt-1 text-lg leading-relaxed">{m.texto}</p>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-border pt-5">
              <label htmlFor="mensagem" className="block text-lg font-semibold text-foreground">
                Escreva sua mensagem para a coordenação
              </label>
              <Textarea
                id="mensagem"
                rows={4}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Ex.: Gostaria de conversar sobre as faltas em Ciências."
                className="text-lg"
              />
              <Button onClick={enviar} className="min-h-12 px-6 text-lg">
                Enviar mensagem
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function BoletimCompleto() {
  const responsibleId = getSession()?.userId;
  const [versao, setVersao] = useState(0);
  const filhos = useCarga(
    () => (responsibleId ? getStudentsByResponsible(responsibleId) : Promise.resolve([])),
    versao,
  );

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="min-h-10 text-base"
        onClick={() => setVersao((v) => v + 1)}
        disabled={filhos.estado === "carregando"}
      >
        Atualizar
      </Button>

      {filhos.estado === "carregando" && (
        <p className="text-base text-muted-foreground">Carregando…</p>
      )}
      {filhos.estado === "erro" && <MensagemErro carga={filhos} />}
      {filhos.estado === "ok" && filhos.dados.length === 0 && (
        <Card>
          <CardContent className="p-6 text-base text-muted-foreground">
            Nenhum aluno vinculado a esta conta.
          </CardContent>
        </Card>
      )}
      {filhos.estado === "ok" &&
        filhos.dados.map((filho) => <BoletinsDoFilho key={filho.userId} filho={filho} />)}
    </div>
  );
}

function BoletinsDoFilho({ filho }: { filho: StudentMinDTO }) {
  const boletins = useCarga(() => getBoletinsByStudent(filho.userId), 0);

  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-bold text-foreground">
        {filho.studentName} · Matrícula nº {filho.matricula}
      </h3>
      {boletins.estado === "carregando" && (
        <p className="text-base text-muted-foreground">Carregando…</p>
      )}
      {boletins.estado === "erro" && <MensagemErro carga={boletins} />}
      {boletins.estado === "ok" && boletins.dados.length === 0 && (
        <Card>
          <CardContent className="p-6 text-base text-muted-foreground">
            Nenhum boletim lançado ainda.
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {boletins.estado === "ok" &&
          boletins.dados.map((b) => <BoletimCard key={b.id} boletim={b} />)}
      </div>
    </div>
  );
}

function BoletimCard({ boletim }: { boletim: Boletim }) {
  const notas = useCarga(() => getNotasByBoletim(boletim.id), 0);

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{boletim.period}</CardTitle>
        <CardDescription className="text-base">
          Média final: {boletim.finalAverage.toFixed(1)} · {boletim.status}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notas.estado === "carregando" && (
          <p className="text-base text-muted-foreground">Carregando…</p>
        )}
        {notas.estado === "erro" && <MensagemErro carga={notas} />}
        {notas.estado === "ok" && grupos.length === 0 && (
          <p className="text-base text-muted-foreground">Nenhuma nota lançada neste boletim.</p>
        )}
        {grupos.map((grupo) => {
          const m = media(grupo.notas.map((n) => n.rate));
          const aprovado = m >= 7;
          const recuperacao = m >= 6 && m < 7;
          return (
            <div
              key={grupo.disciplina.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
            >
              <div>
                <p className="text-lg font-semibold text-foreground">{grupo.disciplina.title}</p>
                <p className="text-sm text-muted-foreground">
                  {grupo.notas.map((n) => n.rate.toFixed(1)).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-bold text-foreground">
                  {m.toFixed(1)}
                </span>
                <Badge
                  className={`px-3 py-1 text-sm font-semibold ${
                    aprovado
                      ? "bg-success text-success-foreground"
                      : recuperacao
                        ? "bg-warning text-warning-foreground"
                        : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {aprovado ? "Em dia" : recuperacao ? "Atenção" : "Recuperação"}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
