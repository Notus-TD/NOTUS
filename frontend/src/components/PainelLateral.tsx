import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type SecaoPainel<Id extends string> = {
  id: Id;
  label: string;
  icon: LucideIcon;
  /** Número em destaque ao lado da seção (ex.: atividades atrasadas). */
  contador?: number;
};

/**
 * Template das telas logadas: sidebar à esquerda (seções) e conteúdo da seção à direita.
 * `topo` entra acima das seções (ex.: a lista de turmas do professor).
 */
export function PainelLateral<Id extends string>({
  secoes,
  secaoAtiva,
  aoSelecionarSecao,
  topo,
  children,
}: {
  secoes: SecaoPainel<Id>[];
  secaoAtiva: Id;
  aoSelecionarSecao: (id: Id) => void;
  topo?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardContent className="space-y-3 p-4">
            {topo}

            <nav aria-label="Seções do painel" className="space-y-1">
              {secoes.map((s) => {
                const ativa = s.id === secaoAtiva;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-current={ativa ? "page" : undefined}
                    onClick={() => aoSelecionarSecao(s.id)}
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
