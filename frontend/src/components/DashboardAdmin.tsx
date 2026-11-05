import { useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAtividades,
  getDisciplinas,
  getFaltas,
  getLecionamentos,
  getNotificacoes,
  getProfessores,
  getStudents,
  getTurmas,
  getUsuarios,
  type AtividadeDTO,
  type DisciplinaDTO,
  type FaltaDTO,
  type LecionamentoDTO,
  type NotificacaoDTO,
  type ProfessorDTO,
  type StudentMinDTO,
  type TurmaDTO,
  type UsuarioDTO,
} from "@/lib/api";
import { BIMESTRES } from "@/lib/bimestres";
import { useCarga, MensagemErro, type Carga } from "@/hooks/use-carga";

/*
 * Dashboard do admin: números e gráficos montados só com as rotas que o admin já usa.
 * Mesmo padrão simples da Visão geral: números em linha, seções sem cards, separação por espaço.
 * Regras de visualização seguidas aqui:
 * - série única = uma cor só (--viz-1); a cor nunca depende da posição;
 * - barras finas (16px), ponta arredondada de 4px e base reta, valor na ponta;
 * - texto sempre na cor de texto, nunca na cor da série;
 * - cada gráfico tem uma visão em tabela (botão "Tabela") e dica ao passar o mouse/focar.
 */

type Item = { rotulo: string; valor: number; detalhe?: string };

const numero = (n: number) => n.toLocaleString("pt-BR");

export function DashboardAdmin() {
  const [versao, setVersao] = useState(0);
  const turmas = useCarga<TurmaDTO[]>(getTurmas, versao);
  const alunos = useCarga<StudentMinDTO[]>(getStudents, versao);
  const professores = useCarga<ProfessorDTO[]>(getProfessores, versao);
  const usuarios = useCarga<UsuarioDTO[]>(getUsuarios, versao);
  const lecionamentos = useCarga<LecionamentoDTO[]>(getLecionamentos, versao);
  const disciplinas = useCarga<DisciplinaDTO[]>(getDisciplinas, versao);
  const faltas = useCarga<FaltaDTO[]>(getFaltas, versao);
  const atividades = useCarga<AtividadeDTO[]>(getAtividades, versao);
  const notificacoes = useCarga<NotificacaoDTO[]>(getNotificacoes, versao);
  const cargas = [
    turmas,
    alunos,
    professores,
    usuarios,
    lecionamentos,
    disciplinas,
    faltas,
    atividades,
    notificacoes,
  ];
  const carregando = cargas.some((c) => c.estado === "carregando");

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <Indicadores
          alunos={alunos}
          turmas={turmas}
          professores={professores}
          usuarios={usuarios}
        />
        <Button
          variant="ghost"
          className="min-h-11 text-base text-muted-foreground"
          onClick={() => setVersao((v) => v + 1)}
          disabled={carregando}
        >
          <RefreshCw className={`size-5 ${carregando ? "animate-spin" : ""}`} aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      <ComposicaoUsuarios usuarios={usuarios} professores={professores} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-14 gap-y-12 xl:grid-cols-2">
        <Painel
          titulo="Alunos por turma"
          rotuloColuna="Turma"
          descricao="Quantidade de alunos em cada turma."
          carga={turmas}
          itens={(ts) =>
            [...ts]
              .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }))
              .map((t) => ({
                rotulo: t.name,
                valor: t.totalAlunos,
                detalhe: `${t.totalAlunos === 1 ? "aluno" : "alunos"}, ano letivo ${t.schoolYear}`,
              }))
          }
          vazio="Nenhuma turma cadastrada."
        />

        <Painel
          titulo="Disciplinas com professor"
          rotuloColuna="Turma"
          descricao="Em cada turma, quantas disciplinas já têm professor vinculado."
          carga={juntar(turmas, lecionamentos, disciplinas)}
          itens={([ts, ls, ds]) =>
            [...ts]
              .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }))
              .map((t) => {
                const cobertas = new Set(
                  ls.filter((l) => l.turmaId === t.id).map((l) => l.disciplinaId),
                ).size;
                return {
                  rotulo: t.name,
                  valor: cobertas,
                  detalhe: `de ${ds.length} disciplinas com professor`,
                };
              })
          }
          maximo={([, , ds]) => ds.length}
          formatar={(i, [, , ds]) => `${i.valor} de ${ds.length}`}
          vazio="Nenhuma turma cadastrada."
        />

        <Painel
          titulo="Carga dos professores"
          rotuloColuna="Professor"
          descricao="Aulas atribuídas a cada professor (uma disciplina numa turma conta como uma)."
          carga={juntar(professores, lecionamentos)}
          itens={([ps, ls]) =>
            ps
              .map((p) => {
                const vinculos = ls.filter((l) => l.professorId === p.id);
                const nTurmas = new Set(vinculos.map((l) => l.turmaId)).size;
                return {
                  rotulo: p.fullName,
                  valor: vinculos.length,
                  detalhe: `${vinculos.length === 1 ? "aula atribuída" : "aulas atribuídas"} em ${nTurmas} ${nTurmas === 1 ? "turma" : "turmas"}`,
                };
              })
              .sort((a, b) => b.valor - a.valor || a.rotulo.localeCompare(b.rotulo, "pt-BR"))
          }
          vazio="Nenhum professor cadastrado."
        />

        <Painel
          titulo="Faltas por disciplina"
          rotuloColuna="Disciplina"
          descricao="Total de faltas registradas em cada disciplina."
          carga={juntar(faltas, disciplinas)}
          itens={([fs, ds]) =>
            ds
              .map((d) => {
                const total = fs
                  .filter((f) => f.disciplinaId === d.id)
                  .reduce((soma, f) => soma + f.quantidade, 0);
                return {
                  rotulo: d.title,
                  valor: total,
                  detalhe: total === 1 ? "falta registrada" : "faltas registradas",
                };
              })
              .sort((a, b) => b.valor - a.valor || a.rotulo.localeCompare(b.rotulo, "pt-BR"))
          }
          vazio="Nenhuma disciplina cadastrada."
        />

        <Painel
          titulo="Atividades por bimestre"
          rotuloColuna="Bimestre"
          descricao="Atividades publicadas pelos professores em cada bimestre."
          carga={atividades}
          itens={(as) =>
            BIMESTRES.map((b) => {
              const total = as.filter((a) => a.bimestre === b.id).length;
              return {
                rotulo: b.label,
                valor: total,
                detalhe: total === 1 ? "atividade publicada" : "atividades publicadas",
              };
            })
          }
          vazio="Nenhuma atividade publicada."
        />

        <Notificacoes carga={notificacoes} />
      </div>
    </div>
  );
}

/* ---------- Números do topo ---------- */

function Indicadores({
  alunos,
  turmas,
  professores,
  usuarios,
}: {
  alunos: Carga<StudentMinDTO[]>;
  turmas: Carga<TurmaDTO[]>;
  professores: Carga<ProfessorDTO[]>;
  usuarios: Carga<UsuarioDTO[]>;
}) {
  const pendentes = juntar(professores, usuarios);
  return (
    <dl className="flex flex-wrap gap-x-14 gap-y-6">
      <Numero
        rotulo="Alunos com matrícula ativa"
        carga={alunos}
        valor={(a) => a.filter((s) => s.matriculaStatus === "ATIVA").length}
        apoio={(a) => {
          const fin = a.filter((s) => s.matriculaStatus === "FINALIZADA").length;
          return `${numero(fin)} ${fin === 1 ? "finalizada" : "finalizadas"}`;
        }}
      />
      <Numero rotulo="Turmas" carga={turmas} valor={(t) => t.length} />
      <Numero rotulo="Professores" carga={professores} valor={(p) => p.length} />
      <Numero
        rotulo="Aguardando primeiro acesso"
        carga={pendentes}
        valor={([ps, us]) =>
          ps.filter((p) => p.acessoPendente).length +
          us.filter((u) => !u.anonimizado && u.acessoPendente).length
        }
        apoio={() => "ainda não abriram o convite"}
      />
    </dl>
  );
}

function Numero<T>({
  rotulo,
  carga,
  valor,
  apoio,
}: {
  rotulo: string;
  carga: Carga<T>;
  valor: (dados: T) => number;
  apoio?: (dados: T) => string;
}) {
  return (
    <div>
      <dt className="text-base text-muted-foreground">{rotulo}</dt>
      <dd className="mt-1 font-display text-5xl font-semibold leading-none text-foreground">
        {carga.estado === "ok" ? numero(valor(carga.dados)) : carga.estado === "erro" ? "–" : "…"}
      </dd>
      {carga.estado === "ok" && apoio && (
        <dd className="mt-2 text-sm text-muted-foreground">{apoio(carga.dados)}</dd>
      )}
      {carga.estado === "erro" && (
        <dd className="mt-2">
          <MensagemErro carga={carga} />
        </dd>
      )}
    </div>
  );
}

/* ---------- Composição: uma barra segmentada (parte de um todo) ---------- */

function ComposicaoUsuarios({
  usuarios,
  professores,
}: {
  usuarios: Carga<UsuarioDTO[]>;
  professores: Carga<ProfessorDTO[]>;
}) {
  const [tabela, setTabela] = useState(false);
  const carga = juntar(usuarios, professores);
  const partes =
    carga.estado === "ok"
      ? [
          {
            rotulo: "Alunos",
            valor: carga.dados[0].filter((u) => u.perfil === "ALUNO" && !u.anonimizado).length,
            cor: "bg-viz-1",
          },
          {
            rotulo: "Responsáveis",
            valor: carga.dados[0].filter((u) => u.perfil === "RESPONSAVEL" && !u.anonimizado)
              .length,
            cor: "bg-viz-2",
          },
          { rotulo: "Professores", valor: carga.dados[1].length, cor: "bg-viz-3" },
        ]
      : [];
  const total = partes.reduce((s, p) => s + p.valor, 0);
  const pct = (v: number) => (total === 0 ? 0 : Math.round((v / total) * 100));

  return (
    <section>
      <CabecalhoPainel
        titulo="Pessoas no sistema"
        descricao={
          carga.estado === "ok"
            ? `${numero(total)} usuários ativos, divididos por perfil.`
            : "Usuários ativos, divididos por perfil."
        }
        tabela={tabela}
        alternar={() => setTabela((t) => !t)}
      />
      <div>
        {carga.estado === "carregando" && <Carregando />}
        {carga.estado === "erro" && <MensagemErro carga={carga} />}
        {carga.estado === "ok" &&
          (tabela ? (
            <Tabela
              colunas={["Perfil", "Pessoas", "Parte do total"]}
              linhas={partes.map((p) => [p.rotulo, numero(p.valor), `${pct(p.valor)}%`])}
            />
          ) : (
            <div className="space-y-3">
              <div
                role="img"
                aria-label={partes
                  .map((p) => `${p.rotulo}: ${p.valor} (${pct(p.valor)}%)`)
                  .join(", ")}
                className="flex h-7 w-full gap-[2px]"
              >
                {partes
                  .filter((p) => p.valor > 0)
                  .map((p) => (
                    <div
                      key={p.rotulo}
                      tabIndex={0}
                      style={{ flexGrow: p.valor, flexBasis: 0 }}
                      className={`group relative flex min-w-0 items-center rounded-[4px] px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring ${p.cor}`}
                    >
                      {/* Só escreve a parte dentro do bloco quando ela cabe com folga. */}
                      {pct(p.valor) >= 10 && (
                        <span className="text-sm font-semibold text-white">{pct(p.valor)}%</span>
                      )}
                      <Dica
                        titulo={p.rotulo}
                        valor={numero(p.valor)}
                        texto={`pessoas, ${pct(p.valor)}% do total`}
                      />
                    </div>
                  ))}
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-foreground">
                {partes.map((p) => (
                  <li key={p.rotulo} className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${p.cor}`} aria-hidden="true" />
                    {p.rotulo}
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </section>
  );
}

/* ---------- Painel com barras horizontais (série única) ---------- */

function Painel<T>({
  titulo,
  descricao,
  carga,
  itens,
  maximo,
  formatar,
  vazio,
  rotuloColuna,
}: {
  titulo: string;
  descricao: string;
  /** Nome da primeira coluna na visão em tabela. */
  rotuloColuna: string;
  carga: Carga<T>;
  itens: (dados: T) => Item[];
  /** Escala fixa (ex.: total de disciplinas); sem ela, a maior barra ocupa a largura toda. */
  maximo?: (dados: T) => number;
  formatar?: (item: Item, dados: T) => string;
  vazio: string;
}) {
  const [tabela, setTabela] = useState(false);
  return (
    <section>
      <CabecalhoPainel
        titulo={titulo}
        descricao={descricao}
        tabela={tabela}
        alternar={() => setTabela((t) => !t)}
      />
      <div>
        {carga.estado === "carregando" && <Carregando />}
        {carga.estado === "erro" && <MensagemErro carga={carga} />}
        {carga.estado === "ok" &&
          (() => {
            const lista = itens(carga.dados);
            if (lista.length === 0)
              return <p className="text-base text-muted-foreground">{vazio}</p>;
            const texto = (i: Item) => (formatar ? formatar(i, carga.dados) : numero(i.valor));
            if (tabela)
              return (
                <Tabela
                  colunas={[rotuloColuna, "Valor"]}
                  linhas={lista.map((i) => [i.rotulo, texto(i)])}
                />
              );
            const escala = maximo ? maximo(carga.dados) : Math.max(...lista.map((i) => i.valor));
            return <BarrasHorizontais itens={lista} escala={escala} texto={texto} />;
          })()}
      </div>
    </section>
  );
}

function BarrasHorizontais({
  itens,
  escala,
  texto,
}: {
  itens: Item[];
  escala: number;
  texto: (i: Item) => string;
}) {
  const semDados = itens.every((i) => i.valor === 0);
  return (
    <div className="space-y-1">
      {semDados && (
        <p className="pb-2 text-sm text-muted-foreground">Ainda não há registros para mostrar.</p>
      )}
      <ul className="space-y-1">
        {itens.map((i) => {
          const largura = escala > 0 ? (i.valor / escala) * 100 : 0;
          return (
            <li
              key={i.rotulo}
              tabIndex={0}
              aria-label={`${i.rotulo}: ${texto(i)}${i.detalhe ? ` ${i.detalhe}` : ""}`}
              className="group relative grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-center gap-3 rounded-md px-1 py-1 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="truncate text-sm text-muted-foreground" title={i.rotulo}>
                {i.rotulo}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                {/* Barra de 16px, base reta e ponta arredondada; valor zero não desenha barra. */}
                {i.valor > 0 && (
                  <span
                    className="h-4 shrink rounded-r-[4px] bg-viz-1"
                    style={{ width: `calc(${largura}% - 4rem)`, minWidth: "4px" }}
                  />
                )}
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {texto(i)}
                </span>
              </span>
              <Dica titulo={i.rotulo} valor={texto(i)} texto={i.detalhe} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Notificações por situação (cores de status, sempre com ícone e texto) ---------- */

function Notificacoes({ carga }: { carga: Carga<NotificacaoDTO[]> }) {
  const grupos: {
    rotulo: string;
    status: NotificacaoDTO["status"][];
    icon: LucideIcon;
    cor: string;
  }[] = [
    {
      rotulo: "Enviadas",
      status: ["ENVIADA", "ENTREGUE", "LIDA"],
      icon: CheckCircle2,
      cor: "text-status-good",
    },
    {
      rotulo: "Na fila",
      status: ["PENDENTE", "ENVIANDO"],
      icon: Clock,
      cor: "text-status-warning",
    },
    { rotulo: "Com falha", status: ["FALHA"], icon: AlertTriangle, cor: "text-status-critical" },
  ];
  return (
    <section>
      <div className="mb-5">
        <h3 className="font-display text-xl font-semibold text-foreground">
          Avisos aos responsáveis
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Situação dos e-mails automáticos de falta, atividade e nota.
        </p>
      </div>
      <div>
        {carga.estado === "carregando" && <Carregando />}
        {carga.estado === "erro" && <MensagemErro carga={carga} />}
        {carga.estado === "ok" &&
          (carga.dados.length === 0 ? (
            <p className="text-base text-muted-foreground">Nenhum aviso gerado ainda.</p>
          ) : (
            <dl className="flex flex-wrap gap-x-12 gap-y-4">
              {grupos.map((g) => {
                const total = carga.dados.filter((n) => g.status.includes(n.status)).length;
                return (
                  <div key={g.rotulo}>
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                      <g.icon className={`size-4 ${g.cor}`} aria-hidden="true" />
                      {g.rotulo}
                    </dt>
                    <dd className="mt-1 font-display text-3xl font-semibold leading-none text-foreground">
                      {numero(total)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          ))}
      </div>
    </section>
  );
}

/* ---------- Peças comuns ---------- */

function CabecalhoPainel({
  titulo,
  descricao,
  tabela,
  alternar,
}: {
  titulo: string;
  descricao: string;
  tabela: boolean;
  alternar: () => void;
}) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4">
      <div className="min-w-0">
        <h3 className="font-display text-xl font-semibold text-foreground">{titulo}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
      </div>
      <button
        type="button"
        onClick={alternar}
        aria-pressed={tabela}
        className="shrink-0 whitespace-nowrap rounded text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {tabela ? "Ver gráfico" : "Ver tabela"}
      </button>
    </div>
  );
}

/** Dica ao passar o mouse ou focar: o nome em cima, o valor em destaque embaixo. */
function Dica({
  titulo,
  valor,
  texto,
}: {
  titulo: string;
  valor: string;
  texto?: string | undefined;
}) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-sm text-popover-foreground shadow-md group-hover:block group-focus-visible:block"
    >
      <span className="block text-muted-foreground">{titulo}</span>
      <strong className="font-semibold">{valor}</strong>
      {texto && <span> {texto}</span>}
    </span>
  );
}

function Tabela({ colunas, linhas }: { colunas: string[]; linhas: string[][] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-muted-foreground">
          {colunas.map((c, i) => (
            <th key={c} className={`py-2 font-medium ${i > 0 ? "text-right" : ""}`}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((l) => (
          <tr key={l[0]} className="border-b border-border last:border-0">
            {l.map((v, i) => (
              <td
                key={i}
                className={`py-2 ${i > 0 ? "text-right tabular-nums" : "text-foreground"}`}
              >
                {v}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Carregando(): ReactNode {
  return <p className="text-base text-muted-foreground">Carregando…</p>;
}

/** Junta várias cargas numa só: fica "ok" quando todas chegaram. */
function juntar<A, B>(a: Carga<A>, b: Carga<B>): Carga<[A, B]>;
function juntar<A, B, C>(a: Carga<A>, b: Carga<B>, c: Carga<C>): Carga<[A, B, C]>;
function juntar(...cargas: Carga<unknown>[]): Carga<unknown[]> {
  const erro = cargas.find((c) => c.estado === "erro");
  if (erro) return erro;
  if (cargas.some((c) => c.estado === "carregando")) return { estado: "carregando" };
  return {
    estado: "ok",
    dados: cargas.map((c) => (c.estado === "ok" ? c.dados : null)),
  };
}
