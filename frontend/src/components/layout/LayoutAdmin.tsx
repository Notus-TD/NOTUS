import type { ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function CabecalhoPagina({
  trilha,
  atual,
  titulo,
  descricao,
  acoes,
}: {
  trilha: string;
  atual?: string | undefined;
  titulo: string;
  descricao?: string | undefined;
  acoes?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-primary-foreground/70">
          {trilha} <span aria-hidden="true">/</span>{" "}
          <span className="text-primary-foreground">{atual ?? titulo}</span>
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-primary-foreground">
          {titulo}
        </h1>
        {descricao && <p className="mt-1 text-sm text-primary-foreground/80">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}

export const classeCabecalhoTabela =
  "bg-primary [&_th]:font-semibold [&_th]:text-primary-foreground [&_tr]:border-0";

export const classeSeletorFaixa =
  "h-9 border-primary-foreground/40 bg-primary-foreground/10 text-sm font-semibold text-primary-foreground [&_svg]:text-primary-foreground [&_svg]:opacity-100";

export const classeBotaoFaixa = "bg-card text-primary shadow-md hover:bg-card/90";

export const classeBotaoFaixaSecundario =
  "border-primary-foreground/60 bg-transparent text-primary-foreground shadow-none hover:bg-primary-foreground/10";

export function Painel({
  titulo,
  icone: Icone,
  ferramentas,
  rodape,
  semEspaco = false,
  className,
  children,
}: {
  titulo?: string;
  icone?: LucideIcon;
  ferramentas?: ReactNode;
  rodape?: ReactNode;
  semEspaco?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn("overflow-hidden rounded-md border border-border bg-card shadow-sm", className)}
    >
      {(titulo || ferramentas) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          {titulo && (
            <h2 className="flex items-center gap-3 text-base font-semibold text-foreground">
              {Icone && (
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icone className="size-4" aria-hidden="true" />
                </span>
              )}
              {titulo}
            </h2>
          )}
          {ferramentas && (
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              {ferramentas}
            </div>
          )}
        </div>
      )}
      <div className={semEspaco ? "" : "p-4"}>{children}</div>
      {rodape && <div className="border-t border-border px-4 py-2.5">{rodape}</div>}
    </section>
  );
}

const tons = {
  sucesso: "bg-success/10 text-success ring-success/25",
  neutro: "bg-muted text-muted-foreground ring-border",
  alerta: "bg-warning/10 text-warning ring-warning/25",
  perigo: "bg-destructive/10 text-destructive ring-destructive/25",
};

export function Etiqueta({ tom, children }: { tom: keyof typeof tons; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tons[tom]}`}
    >
      {children}
    </span>
  );
}

export function Iniciais({ nome }: { nome: string }) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const iniciais =
    partes.length === 0
      ? "?"
      : `${partes[0]![0] ?? ""}${partes.length > 1 ? (partes[partes.length - 1]![0] ?? "") : ""}`;
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold uppercase text-primary"
    >
      {iniciais}
    </span>
  );
}

export function Paginacao({
  pagina,
  porPagina,
  total,
  aoMudar,
}: {
  pagina: number;
  porPagina: number;
  total: number;
  aoMudar: (pagina: number) => void;
}) {
  const ultima = Math.max(1, Math.ceil(total / porPagina));
  const inicio = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const fim = Math.min(total, pagina * porPagina);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        Mostrando {inicio}–{fim} de {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => aoMudar(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span className="px-2 tabular-nums">
          {pagina} de {ultima}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => aoMudar(pagina + 1)}
          disabled={pagina >= ultima}
          aria-label="Próxima página"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export type ItemMenu<Id extends string> = { id: Id; label: string; icon: LucideIcon };

export type GrupoMenu<Id extends string> = {
  label: string;
  icon: LucideIcon;
  contador?: number | undefined;
  itens: ItemMenu<Id>[];
};

export function MenuHorizontal<Id extends string>({
  grupos,
  ativo,
  aoSelecionar,
}: {
  grupos: GrupoMenu<Id>[];
  ativo: Id;
  aoSelecionar: (id: Id) => void;
}) {
  return (
    <nav aria-label="Menu principal" className="bg-primary text-primary-foreground shadow-md">
      <div className="mx-auto flex max-w-7xl items-stretch gap-1 overflow-x-auto px-4 sm:px-6 md:justify-center lg:px-8">
        {grupos.map((g) => {
          const grupoAtivo = g.itens.some((i) => i.id === ativo);
          const classe = `relative flex min-w-24 shrink-0 flex-col items-center justify-center gap-1.5 border-b-[3px] px-4 pb-2.5 pt-3 text-sm font-semibold transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-foreground ${
            grupoAtivo
              ? "border-primary-foreground bg-primary-foreground/10 text-primary-foreground"
              : "border-transparent text-primary-foreground/85"
          }`;
          const unico = g.itens.length === 1 ? g.itens[0] : undefined;
          if (unico) {
            return (
              <button
                key={g.label}
                type="button"
                aria-current={grupoAtivo ? "page" : undefined}
                onClick={() => aoSelecionar(unico.id)}
                className={classe}
              >
                <g.icon className="size-6" aria-hidden="true" />
                {g.label}
                {g.contador !== undefined && g.contador > 0 && (
                  <span className="absolute right-3 top-2 min-w-5 rounded-full bg-destructive px-1.5 text-center text-[11px] font-bold leading-5 text-destructive-foreground">
                    {g.contador}
                  </span>
                )}
              </button>
            );
          }
          return (
            <DropdownMenu key={g.label}>
              <DropdownMenuTrigger className={classe}>
                <g.icon className="size-6" aria-hidden="true" />
                <span className="flex items-center gap-1">
                  {g.label}
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-48">
                {g.itens.map((i) => (
                  <DropdownMenuItem
                    key={i.id}
                    onSelect={() => aoSelecionar(i.id)}
                    className={`gap-2 ${i.id === ativo ? "font-semibold text-primary" : ""}`}
                  >
                    <i.icon className="size-4" aria-hidden="true" />
                    {i.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>
    </nav>
  );
}
