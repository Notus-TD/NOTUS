import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, Bell, MessageCircle, RefreshCw, Users, UserX } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BoletimMatriz } from "@/components/BoletimMatriz";
import { PainelLateral, Secao, type SecaoPainel } from "@/components/PainelLateral";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { aluno, avisos, conversas } from "@/data/notus";
import {
  ApiError,
  getMeuPerfil,
  getMinhaFrequencia,
  getStudentsByResponsible,
  type FrequenciaDTO,
  type MeuPerfilDTO,
  type StudentMinDTO,
} from "@/lib/api";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
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

type SecaoId = "avisos" | "notas" | "faltas" | "conversa";

const secoes: SecaoPainel<SecaoId>[] = [
  {
    id: "avisos",
    label: "Avisos",
    icon: Bell,
  },
  {
    id: "notas",
    label: "Boletim completo",
    icon: BarChart3,
  },
  {
    id: "faltas",
    label: "Controle de faltas",
    icon: UserX,
  },
  {
    id: "conversa",
    label: "Falar com a escola",
    icon: MessageCircle,
  },
];

function PainelResponsavel() {
  const [secao, setSecao] = useState<SecaoId>("avisos");
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

  const naoLidos = avisos.filter((a) => a.naoLido && !lidos.includes(a.titulo)).length;
  const secoesComContador = secoes.map((s) =>
    s.id === "avisos" ? { ...s, contador: naoLidos } : s,
  );

  return (
    <AppShell
      role="ROLE_RESPONSAVEL"
      titulo={`Boa tarde, ${perfil?.nome ?? "..."}`}
      etiqueta={
        perfil?.dependentes[0] && (
          <Badge variant="secondary" className="text-sm">
            Acompanhando: {perfil.dependentes[0].nome}
          </Badge>
        )
      }
    >
      <PainelLateral secoes={secoesComContador} secaoAtiva={secao} aoSelecionarSecao={setSecao}>
        {secao === "avisos" && (
          <Secao titulo="Avisos e notificações">
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
          </Secao>
        )}

        {secao === "notas" && (
          <Secao titulo="Boletim completo">
            <BoletimCompleto />
          </Secao>
        )}

        {secao === "faltas" && (
          <Secao titulo="Controle de faltas">
            <div className="mb-4 flex justify-end">
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
            {frequencia && frequencia.length > 0 && <FrequenciaPorFilho frequencia={frequencia} />}
          </Secao>
        )}

        {secao === "conversa" && (
          <Secao titulo="Falar com a escola">
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
          </Secao>
        )}
      </PainelLateral>
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
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="min-h-10 text-base"
          onClick={() => setVersao((v) => v + 1)}
          disabled={filhos.estado === "carregando"}
        >
          <RefreshCw
            className={`size-4 ${filhos.estado === "carregando" ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Atualizar
        </Button>
      </div>

      {filhos.estado === "carregando" && (
        <p className="text-base text-muted-foreground">Carregando…</p>
      )}
      {filhos.estado === "erro" && <MensagemErro carga={filhos} />}
      {filhos.estado === "ok" && filhos.dados.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <Users className="size-10 text-muted-foreground/60" aria-hidden="true" />
            <p className="text-base text-muted-foreground">
              Nenhum aluno vinculado a esta conta. Procure a secretaria da escola.
            </p>
          </CardContent>
        </Card>
      )}
      {filhos.estado === "ok" &&
        filhos.dados.map((filho) => (
          <BoletinsDoFilho key={`${filho.userId}-${versao}`} filho={filho} />
        ))}
    </div>
  );
}

function BoletinsDoFilho({ filho }: { filho: StudentMinDTO }) {
  const iniciais = filho.studentName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-base font-bold text-primary"
          aria-hidden="true"
        >
          {iniciais}
        </span>
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">{filho.studentName}</h3>
          <p className="text-sm text-muted-foreground">Matrícula nº {filho.matricula}</p>
        </div>
      </div>
      <BoletimMatriz studentId={filho.userId} />
    </section>
  );
}

const PRESENCA_MINIMA = 75;
const PRESENCA_ATENCAO = 85;

function situacaoPresenca(percentual: number) {
  if (percentual >= PRESENCA_ATENCAO)
    return { rotulo: "Regular", texto: "text-success", barra: "bg-primary" };
  if (percentual >= PRESENCA_MINIMA)
    return { rotulo: "Atenção", texto: "text-warning", barra: "bg-warning" };
  return { rotulo: "Abaixo do mínimo", texto: "text-destructive", barra: "bg-destructive" };
}

function FrequenciaPorFilho({ frequencia }: { frequencia: FrequenciaDTO[] }) {
  const filhos = frequencia.reduce<{ id: number; nome: string; itens: FrequenciaDTO[] }[]>(
    (grupos, f) => {
      const grupo = grupos.find((g) => g.id === f.studentId);
      if (grupo) grupo.itens.push(f);
      else grupos.push({ id: f.studentId, nome: f.studentName, itens: [f] });
      return grupos;
    },
    [],
  );

  return (
    <div className="space-y-8">
      {filhos.map((filho) => (
        <div key={filho.id} className="space-y-3">
          {filhos.length > 1 && (
            <h3 className="font-display text-xl font-bold text-foreground">{filho.nome}</h3>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filho.itens.map((f) => (
              <CardFrequencia key={f.disciplinaId} frequencia={f} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardFrequencia({ frequencia: f }: { frequencia: FrequenciaDTO }) {
  const percentual = Math.round(f.percentualPresenca);
  const situacao = situacaoPresenca(percentual);
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <p className="text-base font-semibold text-muted-foreground">{f.disciplinaTitle}</p>
        <div>
          <p className="font-display text-5xl font-bold tabular-nums text-foreground">
            {f.totalFaltas}
          </p>
          <p className="mt-1 text-base text-muted-foreground">
            {f.totalFaltas === 1 ? "falta" : "faltas"} em {f.totalAulas}{" "}
            {f.totalAulas === 1 ? "aula" : "aulas"}
          </p>
        </div>
        <div
          className="relative h-2.5 rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={percentual}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percentual}% de presença em ${f.disciplinaTitle}`}
        >
          <div
            className={cn("h-full rounded-full", situacao.barra)}
            style={{ width: `${percentual}%` }}
          />
          <span
            className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-foreground/40"
            style={{ left: `${PRESENCA_MINIMA}%` }}
            title={`Mínimo exigido: ${PRESENCA_MINIMA}%`}
          />
        </div>
        <div className="flex items-baseline justify-between gap-2 text-base">
          <span className="tabular-nums text-muted-foreground">{percentual}% presença</span>
          <span className={cn("font-semibold", situacao.texto)}>{situacao.rotulo}</span>
        </div>
      </CardContent>
    </Card>
  );
}
