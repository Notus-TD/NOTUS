import type { KeyboardEvent, ReactNode } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizar } from "@/lib/busca";

export type SecaoPainel<Id extends string> = {
  id: Id;
  label: string;
  icon: typeof Search;
  /** Palavras extras que a busca da sidebar também encontra. */
  termos: string;
  /** Número em destaque ao lado da seção (ex.: atividades atrasadas). */
  contador?: number;
};

function filtrarSecoes<Id extends string>(secoes: SecaoPainel<Id>[], busca: string) {
  const q = normalizar(busca.trim());
  if (!q) return secoes;
  return secoes.filter((s) => normalizar(`${s.label} ${s.termos}`).includes(q));
}

/**
 * Template das telas logadas: sidebar à esquerda (busca + seções) e conteúdo da seção à direita.
 * `topo` entra entre a busca e as seções (ex.: a lista de turmas do professor).
 */
export function PainelLateral<Id extends string>({
  secoes,
  secaoAtiva,
  aoSelecionarSecao,
  busca,
  aoMudarBusca,
  placeholderBusca = "Pesquisar...",
  aoPressionarEnter,
  topo,
  children,
}: {
  secoes: SecaoPainel<Id>[];
  secaoAtiva: Id;
  aoSelecionarSecao: (id: Id) => void;
  busca: string;
  aoMudarBusca: (valor: string) => void;
  placeholderBusca?: string;
  /** Roda antes do Enter padrão (abrir a primeira seção encontrada); devolve true se já tratou. */
  aoPressionarEnter?: () => boolean;
  topo?: ReactNode;
  children: ReactNode;
}) {
  const secoesFiltradas = filtrarSecoes(secoes, busca);

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (aoPressionarEnter?.()) {
        aoMudarBusca("");
      } else if (secoesFiltradas[0]) {
        aoSelecionarSecao(secoesFiltradas[0].id);
        aoMudarBusca("");
      }
    }
    if (e.key === "Escape") aoMudarBusca("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                aria-label="Pesquisar no painel"
                placeholder={placeholderBusca}
                value={busca}
                onChange={(e) => aoMudarBusca(e.target.value)}
                onKeyDown={aoTeclar}
                className="h-12 pl-10 text-base"
              />
            </div>

            {topo}

            <nav aria-label="Seções do painel" className="space-y-1">
              {secoesFiltradas.length === 0 && !topo && (
                <p className="px-3 py-2 text-base text-muted-foreground">
                  Nada encontrado para "{busca}".
                </p>
              )}
              {secoesFiltradas.map((s) => {
                const ativa = s.id === secaoAtiva;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-current={ativa ? "page" : undefined}
                    onClick={() => {
                      aoSelecionarSecao(s.id);
                      aoMudarBusca("");
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                      ativa ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    <s.icon className="size-5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-base font-semibold">{s.label}</span>
                    {s.contador !== undefined && s.contador > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-sm font-bold ${
                          ativa
                            ? "bg-primary-foreground/20"
                            : "bg-destructive text-destructive-foreground"
                        }`}
                      >
                        {s.contador}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </aside>

      <section className="min-w-0 space-y-6">{children}</section>
    </div>
  );
}

/** Cabeçalho padrão do conteúdo de uma seção do painel. */
export function Secao({
  titulo,
  etiqueta,
  children,
}: {
  titulo: string;
  /** Informação curta ao lado do título (ex.: turma e disciplina). */
  etiqueta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-bold text-foreground">{titulo}</h2>
        {etiqueta}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
