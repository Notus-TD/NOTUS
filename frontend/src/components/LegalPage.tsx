import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const VERSAO_DOCUMENTOS = "1.0";
export const ATUALIZADO_EM = "23/09/2026";

export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold text-foreground">{titulo}</h2>
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function Destaque({ children }: { children: ReactNode }) {
  return <strong className="text-foreground">{children}</strong>;
}

export function LinksLegais({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      <Link to="/privacidade" className="text-primary underline">
        Política de Privacidade
      </Link>
      {" · "}
      <Link to="/termos" className="text-primary underline">
        Termos de Uso
      </Link>
    </span>
  );
}

export function LegalPage({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
              N
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              NOTUS
            </span>
          </span>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-base font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {titulo}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Versão {VERSAO_DOCUMENTOS} · atualizada em {ATUALIZADO_EM}
        </p>

        <div className="mt-10">{children}</div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-base text-muted-foreground sm:px-6">
          <span>
            NOTUS · Portal de gestão escolar · Dúvidas: secretaria@colegionotus.com.br · (11)
            4002-8922
          </span>
          <LinksLegais />
        </div>
      </footer>
    </div>
  );
}
