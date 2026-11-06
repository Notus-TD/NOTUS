import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { MarcaNotus } from "@/components/AppShell";

export type SecaoPainel<Id extends string> = {
  id: Id;
  label: string;
  icon: LucideIcon;
  /** Número em destaque ao lado da seção (ex.: atividades atrasadas). */
  contador?: number;
};

/**
 * Template das telas logadas: sidebar à esquerda (seções) e conteúdo da seção à direita.
 * No desktop a sidebar é fixa, encostada à esquerda e com a altura toda da tela (o AppShell
 * reserva o espaço com lg:pl-72). No celular ela vira um card acima do conteúdo.
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
    <div className="space-y-6">
      <aside className="rounded-xl border border-border bg-card shadow-sm lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:mb-0 lg:flex lg:w-72 lg:flex-col lg:rounded-none lg:border-0 lg:border-r lg:shadow-none">
        <div className="hidden h-18 shrink-0 items-center border-b border-border px-6 lg:flex">
          <MarcaNotus />
        </div>
        <div className="painel-scrollable space-y-3 p-4 lg:flex-1 lg:overflow-y-auto">
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
        </div>
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
