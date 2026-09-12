import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PerfilSwitcher } from "./PerfilSwitcher";

export function AppShell({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
              N
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">NOTUS</span>
          </Link>
          <span className="hidden text-base text-muted-foreground sm:block">Colégio Notus · 2026</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <PerfilSwitcher />

        <div className="mt-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {titulo}
          </h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{subtitulo}</p>
        </div>

        <div className="mt-8 space-y-8">{children}</div>
      </main>

      <footer className="mt-12 border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-base text-muted-foreground sm:px-6">
          NOTUS · Portal de gestão escolar · Dúvidas: secretaria@colegionotus.com.br · (11) 4002-8922
        </div>
      </footer>
    </div>
  );
}
