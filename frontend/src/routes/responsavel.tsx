import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Bell, ClipboardList, RefreshCw, Users, UserX } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BoletimMatriz } from "@/components/BoletimMatriz";
import { PainelLateral, Secao, type SecaoPainel } from "@/components/PainelLateral";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/blocos";
import { ListaAtividades } from "@/components/ListaAtividades";
import {
  ApiError,
  getAtividadesDoAluno,
  getComunicadosParaMim,
  getMeuPerfil,
  getMeusAvisos,
  getMinhaFrequencia,
  getMinhasFaltas,
  getStudentsByResponsible,
  type AtividadeDTO,
  type AvisoDTO,
  type ComunicadoDTO,
  type FaltaDTO,
  type FrequenciaDTO,
  type MeuPerfilDTO,
  type StudentMinDTO,
} from "@/lib/api";
import { paraAtividadeAluno } from "@/lib/atividadesAluno";
import { formatarData, hojeLocal } from "@/lib/datas";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useCarga, MensagemErro } from "@/hooks/use-carga";

export const Route = createFileRoute("/responsavel")({
  head: () => ({
    meta: [
      { title: "Painel do Responsável · NOTUS" },
      {
        name: "description",
        content: "Avisos da escola, boletim, controle de faltas e atividades dos filhos.",
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

type SecaoId = "avisos" | "notas" | "faltas" | "atividades";

const secoes: SecaoPainel<SecaoId>[] = [
  {
    id: "avisos",
    label: "Avisos",
    icon: Bell,
  },
  {
    id: "notas",
    label: "Boletim",
    icon: BarChart3,
  },
  {
    id: "faltas",
    label: "Controle de faltas",
    icon: UserX,
  },
  {
    id: "atividades",
    label: "Atividades",
    icon: ClipboardList,
  },
];

function saudacao(hora = new Date().getHours()) {
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

// ! REFC: Item da lista de avisos: um comunicado da escola ou um aviso automático (falta, nota, atividade)
type ItemAviso = { chave: string; titulo: string; texto: string; origem: string; quando: string };

// ! REFC: Monta lista de avisos: combina comunicados globais (admin) + recados de turma (professor) + avisos automáticos (falta/nota/atividade)
function montarAvisos(comunicados: ComunicadoDTO[], avisos: AvisoDTO[]): ItemAviso[] {
  return [
    // ! REFC: Comunicados aparecem com origem "Secretaria da escola", ordenados por data descendente
    ...comunicados.map((c) => ({
      chave: `c-${c.id}`,
      titulo: c.titulo,
      texto: c.texto,
      origem: "Secretaria da escola",
      quando: c.enviadoEm,
    })),
    // ! REFC: Avisos automáticos aparecem com origem "Sobre {aluno}" ou "Escola" se genérico
    ...avisos.map((a) => ({
      chave: `n-${a.id}`,
      titulo: a.titulo,
      texto: a.texto,
      origem: a.alunoNome ? `Sobre ${a.alunoNome}` : "Escola",
      quando: a.criadoEm,
    })),
  ].sort((a, b) => b.quando.localeCompare(a.quando));
}

// O que já foi lido fica só neste navegador, por usuário: é uma conveniência de leitura.
const chaveLidos = () => `notus.avisosLidos.${getSession()?.email ?? ""}`;

function lerLidos(): string[] {
  try {
    return JSON.parse(localStorage.getItem(chaveLidos()) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function salvarLidos(lista: string[]) {
  try {
    localStorage.setItem(chaveLidos(), JSON.stringify(lista));
  } catch {
    /* navegador sem armazenamento: segue sem lembrar */
  }
}

function PainelResponsavel() {
  const [secao, setSecao] = useState<SecaoId>("avisos");
  const [lidos, setLidos] = useState<string[]>([]);
  useEffect(() => setLidos(lerLidos()), []);
  function marcarLidos(chaves: string[]) {
    setLidos((atual) => {
      const nova = [...new Set([...atual, ...chaves])];
      salvarLidos(nova);
      return nova;
    });
  }

  const [versaoAvisos, setVersaoAvisos] = useState(0);
  const comunicados = useCarga<ComunicadoDTO[]>(getComunicadosParaMim, versaoAvisos);
  const avisosApi = useCarga<AvisoDTO[]>(getMeusAvisos, versaoAvisos);
  const itensAvisos =
    comunicados.estado === "ok" && avisosApi.estado === "ok"
      ? montarAvisos(comunicados.dados, avisosApi.dados)
      : null;
  const erroAvisos =
    comunicados.estado === "erro" ? comunicados : avisosApi.estado === "erro" ? avisosApi : null;

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
  const [faltas, setFaltas] = useState<FaltaDTO[]>([]);

  async function buscarFrequencia() {
    setCarregandoFrequencia(true);
    setErroFrequencia(null);
    try {
      const [freq, faltasApi] = await Promise.all([getMinhaFrequencia(), getMinhasFaltas()]);
      setFrequencia(freq);
      setFaltas(faltasApi);
    } catch (e) {
      setErroFrequencia(e instanceof ApiError ? e.message : "Erro ao carregar as faltas.");
    } finally {
      setCarregandoFrequencia(false);
    }
  }

  useEffect(() => {
    void buscarFrequencia();
  }, []);

  const naoLidos = (itensAvisos ?? []).filter((a) => !lidos.includes(a.chave)).length;
  const secoesComContador = secoes.map((s) =>
    s.id === "avisos" ? { ...s, contador: naoLidos } : s,
  );

  return (
    <AppShell role="ROLE_RESPONSAVEL" titulo={`${saudacao()}, ${perfil?.nome ?? "..."}`}>
      <PainelLateral secoes={secoesComContador} secaoAtiva={secao} aoSelecionarSecao={setSecao}>
        {secao === "avisos" && (
          <Secao titulo="Avisos e notificações">
            {erroAvisos && <MensagemErro carga={erroAvisos} />}
            {itensAvisos === null && !erroAvisos && (
              <p className="text-base text-muted-foreground">Carregando…</p>
            )}
            {itensAvisos && (
              <ListaAvisos
                itens={itensAvisos}
                lidos={lidos}
                aoMarcarLido={(chave) => marcarLidos([chave])}
                aoMarcarTodos={() => marcarLidos(itensAvisos.map((a) => a.chave))}
                aoAtualizar={() => setVersaoAvisos((v) => v + 1)}
              />
            )}
          </Secao>
        )}

        {secao === "notas" && (
          <Secao titulo="Boletim">
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
            {frequencia && frequencia.length > 0 && (
              <FrequenciaPorFilho frequencia={frequencia} faltas={faltas} />
            )}
          </Secao>
        )}

        {secao === "atividades" && (
          <Secao titulo="Atividades">
            <AtividadesDosFilhos />
          </Secao>
        )}
      </PainelLateral>
    </AppShell>
  );
}

// Avisos numa lista simples: título e mensagem à esquerda; de onde veio, quando e o estado
// (novo ou lido) à direita. Os não lidos vêm primeiro; dentro de cada grupo, os mais recentes.
function ListaAvisos({
  itens,
  lidos,
  aoMarcarLido,
  aoMarcarTodos,
  aoAtualizar,
}: {
  itens: ItemAviso[];
  lidos: string[];
  aoMarcarLido: (chave: string) => void;
  aoMarcarTodos: () => void;
  aoAtualizar: () => void;
}) {
  const novo = (a: ItemAviso) => !lidos.includes(a.chave);
  const novos = itens.filter(novo).length;
  const ordenados = [...itens].sort((a, b) => Number(novo(b)) - Number(novo(a)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-base text-muted-foreground">
          {itens.length === 0
            ? "Nenhum aviso ainda."
            : novos === 0
              ? "Nenhum aviso novo. Você está em dia."
              : `Você tem ${novos} ${novos === 1 ? "aviso novo" : "avisos novos"}.`}
        </p>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          {novos > 0 && (
            <button
              type="button"
              onClick={aoMarcarTodos}
              className="rounded text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Marcar todos como lidos
            </button>
          )}
          <button
            type="button"
            onClick={aoAtualizar}
            className="rounded text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Atualizar
          </button>
        </div>
      </div>

      {itens.length === 0 ? (
        <p className="max-w-prose text-base text-muted-foreground">
          Aqui aparecem os comunicados da escola e os avisos sobre faltas, notas e atividades dos
          seus filhos.
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {ordenados.map((a) => {
            const ehNovo = novo(a);
            return (
              <li
                key={a.chave}
                className="grid gap-x-8 gap-y-2 py-5 sm:grid-cols-[minmax(0,1fr)_15rem]"
              >
                <div className="min-w-0">
                  <p
                    className={`text-lg font-semibold ${ehNovo ? "text-foreground" : "text-foreground/80"}`}
                  >
                    {a.titulo}
                  </p>
                  <p className="mt-1 max-w-prose whitespace-pre-line text-base leading-relaxed text-foreground/80">
                    {a.texto}
                  </p>
                </div>
                <div className="text-sm sm:text-right">
                  <p className="font-medium text-foreground">{a.origem}</p>
                  <p className="text-muted-foreground">
                    {new Date(a.quando).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  {ehNovo ? (
                    <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:justify-end">
                      <span className="font-semibold text-primary">Novo</span>
                      <button
                        type="button"
                        onClick={() => aoMarcarLido(a.chave)}
                        className="rounded font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Marcar como lido
                      </button>
                    </p>
                  ) : (
                    <p className="mt-2 text-muted-foreground">Lido</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">{filho.studentName}</h3>
          <p className="text-sm text-muted-foreground">Matrícula {filho.matricula}</p>
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

function FrequenciaPorFilho({
  frequencia,
  faltas,
}: {
  frequencia: FrequenciaDTO[];
  faltas: FaltaDTO[];
}) {
  // Dias de cada falta, por aluno e disciplina (RF06: data e disciplina de cada falta).
  const dias = new Map<string, string[]>();
  for (const f of [...faltas].sort((a, b) => a.data.localeCompare(b.data))) {
    const chave = `${f.studentId}:${f.disciplinaId}`;
    dias.set(chave, [...(dias.get(chave) ?? []), formatarData(f.data)]);
  }

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
              <CardFrequencia
                key={f.disciplinaId}
                frequencia={f}
                dias={dias.get(`${f.studentId}:${f.disciplinaId}`) ?? []}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardFrequencia({ frequencia: f, dias }: { frequencia: FrequenciaDTO; dias: string[] }) {
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
        <p className="text-sm text-muted-foreground">
          {dias.length === 0
            ? "Nenhuma falta nesta disciplina."
            : `${dias.length === 1 ? "Dia da falta" : "Dias das faltas"}: ${dias.join(", ")}`}
        </p>
      </CardContent>
    </Card>
  );
}

function AtividadesDosFilhos() {
  const responsibleId = getSession()?.userId;
  const [versao, setVersao] = useState(0);
  const filhos = useCarga(
    () => (responsibleId ? getStudentsByResponsible(responsibleId) : Promise.resolve([])),
    versao,
  );

  return (
    <div className="space-y-10">
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
        <p className="text-base text-muted-foreground">
          Nenhum aluno vinculado a esta conta. Procure a secretaria da escola.
        </p>
      )}
      {filhos.estado === "ok" &&
        filhos.dados.map((filho) => (
          <AtividadesDoFilho key={`${filho.userId}-${versao}`} filho={filho} />
        ))}
    </div>
  );
}

function AtividadesDoFilho({ filho }: { filho: StudentMinDTO }) {
  const atividades = useCarga<AtividadeDTO[]>(() => getAtividadesDoAluno(filho.userId), 0);
  const hoje = hojeLocal();
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-xl font-bold text-foreground">{filho.studentName}</h3>
        <p className="text-sm text-muted-foreground">Matrícula {filho.matricula}</p>
      </div>
      {atividades.estado === "carregando" && (
        <p className="text-base text-muted-foreground">Carregando…</p>
      )}
      {atividades.estado === "erro" && <MensagemErro carga={atividades} />}
      {atividades.estado === "ok" && (
        <ListaAtividades
          itens={atividades.dados.map((a) => paraAtividadeAluno(a, hoje))}
          vazio="Nenhuma atividade publicada para a turma ainda."
        />
      )}
    </section>
  );
}
