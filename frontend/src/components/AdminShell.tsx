import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { LogOut, Search, ShieldCheck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearSession, getSession, homeForRoles, type Session } from "@/lib/auth";

export type SidebarItem<T extends string> = {
  id: T;
  label: string;
  descricao: string;
  icon: LucideIcon;
  termos?: string;
  badge?: number;
};

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function AdminShell<T extends string>({
  itens,
  ativo,
  onSelecionar,
  titulo,
  subtitulo,
  children,
}: {
  itens: SidebarItem<T>[];
  ativo: T;
  onSelecionar: (id: T) => void;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const atual = getSession();
    if (!atual) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (!atual.roles.includes("ROLE_ADMIN")) {
      navigate({ to: homeForRoles(atual.roles), replace: true });
      return;
    }
    setSession(atual);
  }, [navigate]);

  const filtrados = useMemo(() => {
    const q = normalizar(busca.trim());
    if (!q) return itens;
    return itens.filter((i) => normalizar(`${i.label} ${i.descricao} ${i.termos ?? ""}`).includes(q));
  }, [busca, itens]);

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && filtrados[0]) {
      onSelecionar(filtrados[0].id);
      setBusca("");
    }
    if (e.key === "Escape") setBusca("");
  }

  function sair() {
    clearSession();
    navigate({ to: "/login", replace: true });
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background lg:pl-72">
      <aside className="flex flex-col border-b border-border bg-card lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
            N
          </span>
          <span className="min-w-0">
            <span className="block font-display text-xl font-bold tracking-tight text-foreground">NOTUS</span>
            <span className="block truncate text-sm text-muted-foreground">Colégio Notus · 2026</span>
          </span>
        </div>

        <div className="px-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Pesquisar no painel"
              placeholder="Pesquisar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={aoTeclar}
              className="h-11 bg-background pl-10 text-base"
            />
          </div>
        </div>

        <nav aria-label="Seções do painel" className="mt-4 flex-1 space-y-1 overflow-y-auto px-3">
          {filtrados.length === 0 && (
            <p className="px-3 py-2 text-base text-muted-foreground">Nada encontrado para "{busca}".</p>
          )}
          {filtrados.map((i) => {
            const on = i.id === ativo;
            return (
              <button
                key={i.id}
                type="button"
                aria-current={on ? "page" : undefined}
                onClick={() => {
                  onSelecionar(i.id);
                  setBusca("");
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  on ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-accent"
                }`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    on ? "bg-primary-foreground/15" : "bg-secondary text-secondary-foreground group-hover:bg-background"
                  }`}
                >
                  <i.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold leading-tight">{i.label}</span>
                  <span className={`block truncate text-sm ${on ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {i.descricao}
                  </span>
                </span>
                {i.badge !== undefined && i.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-sm font-bold ${
                      on ? "bg-primary-foreground/20" : "bg-destructive text-destructive-foreground"
                    }`}
                  >
                    {i.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-foreground">Administrador</span>
              <span className="block truncate text-sm text-muted-foreground" title={session.email}>
                {session.email}
              </span>
            </span>
            <Button variant="ghost" size="icon" aria-label="Sair" title="Sair" onClick={sair} className="size-10">
              <LogOut className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{titulo}</h1>
        {subtitulo && <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{subtitulo}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
