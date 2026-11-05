import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { situacaoInfo, type AtividadeAluno, type Situacao } from "@/lib/atividadesAluno";

/*
 * Lista de atividades de um aluno com a situação da entrega (atrasada, para entregar, entregue),
 * números no topo e filtro. Usada pelo aluno e pelo responsável (uma lista por filho).
 */

type Filtro = "todas" | "atrasada" | "pendente" | "entregue";

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: "todas", rotulo: "Todas" },
  { id: "atrasada", rotulo: "Atrasadas" },
  { id: "pendente", rotulo: "Para entregar" },
  { id: "entregue", rotulo: "Entregues" },
];

const grupo = (s: Situacao): Exclude<Filtro, "todas"> =>
  s === "atrasada" ? "atrasada" : s === "entregue" ? "entregue" : "pendente";

// Atrasadas primeiro, depois as que vencem antes; entregues no fim (as mais recentes em cima).
const ORDEM: Record<Exclude<Filtro, "todas">, number> = { atrasada: 0, pendente: 1, entregue: 2 };

const ICONE_SITUACAO = {
  atrasada: AlertTriangle,
  hoje: Clock,
  proxima: Clock,
  entregue: CheckCircle2,
} as const;

export function ListaAtividades({
  itens,
  vazio = "Nenhuma atividade publicada para você ainda.",
}: {
  itens: AtividadeAluno[];
  /** Texto quando não há nenhuma atividade publicada. */
  vazio?: string;
}) {
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const contagem = {
    atrasada: itens.filter((a) => grupo(a.situacao) === "atrasada").length,
    pendente: itens.filter((a) => grupo(a.situacao) === "pendente").length,
    entregue: itens.filter((a) => grupo(a.situacao) === "entregue").length,
  };
  const visiveis = itens
    .filter((a) => filtro === "todas" || grupo(a.situacao) === filtro)
    .sort((a, b) => {
      const ga = grupo(a.situacao);
      const gb = grupo(b.situacao);
      if (ga !== gb) return ORDEM[ga] - ORDEM[gb];
      return ga === "entregue"
        ? b.prazoData.localeCompare(a.prazoData)
        : a.prazoData.localeCompare(b.prazoData);
    });

  if (itens.length === 0) {
    return <p className="text-base text-muted-foreground">{vazio}</p>;
  }

  return (
    <div className="space-y-8">
      <dl className="flex flex-wrap gap-x-12 gap-y-4 border-b border-border pb-6">
        <Contagem rotulo="Atrasadas" valor={contagem.atrasada} destaque={contagem.atrasada > 0} />
        <Contagem rotulo="Para entregar" valor={contagem.pendente} />
        <Contagem rotulo="Entregues" valor={contagem.entregue} />
      </dl>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar atividades">
        {FILTROS.map((f) => {
          const n = f.id === "todas" ? itens.length : contagem[f.id];
          return (
            <Button
              key={f.id}
              type="button"
              variant={filtro === f.id ? "default" : "outline"}
              className="min-h-10 text-base"
              aria-pressed={filtro === f.id}
              onClick={() => setFiltro(f.id)}
            >
              {f.rotulo} ({n})
            </Button>
          );
        })}
      </div>

      {visiveis.length === 0 ? (
        <p className="text-base text-muted-foreground">
          {filtro === "atrasada"
            ? "Nenhuma atividade atrasada. Tudo em dia."
            : filtro === "pendente"
              ? "Nenhuma atividade para entregar agora."
              : "Nenhuma atividade entregue ainda."}
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {visiveis.map((a) => {
            const info = situacaoInfo[a.situacao];
            const Icone = ICONE_SITUACAO[a.situacao];
            return (
              <li
                key={a.id}
                className="grid gap-x-8 gap-y-2 py-5 sm:grid-cols-[minmax(0,1fr)_12rem]"
              >
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-foreground">{a.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {a.disciplina}
                    {a.pontos !== null &&
                      `, vale ${a.pontos.toFixed(1).replace(".", ",")} ${a.pontos === 1 ? "ponto" : "pontos"}`}
                  </p>
                  <p className="mt-2 max-w-prose text-base text-foreground/80">{a.descricao}</p>
                </div>
                <div className="sm:text-right">
                  <p
                    className={`flex items-center gap-1.5 text-base font-semibold sm:justify-end ${info.classe}`}
                  >
                    <Icone className="size-4 shrink-0" aria-hidden="true" />
                    {info.texto}
                  </p>
                  <p className="text-sm text-muted-foreground">{a.prazo}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Contagem({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div>
      <dt className="text-base text-muted-foreground">{rotulo}</dt>
      <dd
        className={`mt-1 font-display text-4xl font-semibold leading-none ${destaque ? "text-destructive" : "text-foreground"}`}
      >
        {valor}
      </dd>
    </div>
  );
}
