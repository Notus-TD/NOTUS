import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { GraduationCap, Users, ClipboardCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSession, getSession, homeForRoles, type Role, type Session } from "@/lib/auth";

const perfil: Record<Role, { label: string; icon: typeof GraduationCap }> = {
  ROLE_ALUNO: { label: "Aluno", icon: GraduationCap },
  ROLE_RESPONSAVEL: { label: "Pai / Responsável", icon: Users },
  ROLE_PROFESSOR: { label: "Professor", icon: ClipboardCheck },
};

export function AppShell({
  titulo,
  subtitulo,
  role,
  children,
}: {
  titulo: string;
  subtitulo: string;
  role?: Role;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const atual = getSession();
    if (!atual) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (role && !atual.roles.includes(role)) {
      navigate({ to: homeForRoles(atual.roles), replace: true });
      return;
    }
    setSession(atual);
  }, [navigate, role]);

  function sair() {
    clearSession();
    navigate({ to: "/login", replace: true });
  }

  if (!session) return null;

  const roleAtual = role ?? session.roles[0];
  const info = roleAtual ? perfil[roleAtual] : undefined;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
              N
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">NOTUS</span>
          </span>

          <div className="flex items-center gap-3">
            {info && (
              <span className="hidden items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-base font-semibold text-secondary-foreground sm:flex">
                <info.icon className="size-5" aria-hidden="true" />
                {info.label}
              </span>
            )}
            <span className="hidden max-w-56 truncate text-base text-muted-foreground md:block" title={session.email}>
              {session.email}
            </span>
            <Button variant="outline" className="min-h-11 text-base" onClick={sair}>
              <LogOut className="size-5" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div>
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
