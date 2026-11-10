import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { GraduationCap, Users, ClipboardCheck, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSession, getSession, homeForRoles, type Role, type Session } from "@/lib/sessao";
import { RodapeSite } from "@/features/legal/LegalPage";

const perfil: Record<Role, { label: string; icon: typeof GraduationCap }> = {
  ROLE_ALUNO: { label: "Aluno", icon: GraduationCap },
  ROLE_RESPONSAVEL: { label: "Responsável", icon: Users },
  ROLE_PROFESSOR: { label: "Professor", icon: ClipboardCheck },
  ROLE_ADMIN: { label: "Administrador", icon: ShieldCheck },
};

export function MarcaNotus({
  className = "",
  clara = false,
}: {
  className?: string;
  clara?: boolean;
}) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <img
        src="/notus-marca.png"
        alt=""
        width={40}
        height={40}
        className={`size-10 shrink-0 ${clara ? "rounded-lg bg-white p-1 shadow-sm" : ""}`}
      />
      <span
        className={`font-display text-xl font-bold tracking-tight ${clara ? "text-primary-foreground" : "text-primary"}`}
      >
        NOTUS
      </span>
    </span>
  );
}

export function AppShell({
  titulo,
  etiqueta,
  role,
  navegacao,
  children,
}: {
  titulo?: string;
  etiqueta?: ReactNode;
  role?: Role;
  navegacao?: ReactNode;
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
    if (atual.firstLogin) {
      navigate({ to: "/onboarding", replace: true });
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
    <div className={`flex min-h-screen flex-col bg-background ${navegacao ? "" : "lg:pl-72"}`}>
      <header
        className={
          navegacao
            ? "border-b border-border bg-card text-foreground"
            : "bg-primary text-primary-foreground shadow-md"
        }
      >
        <div
          className={`flex h-18 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 ${navegacao ? "mx-auto w-full max-w-7xl" : "lg:justify-end"}`}
        >
          <MarcaNotus clara={!navegacao} className={navegacao ? "" : "lg:hidden"} />

          <div className="flex items-center gap-3">
            {info && (
              <span className="hidden items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-base font-semibold text-secondary-foreground sm:flex">
                <info.icon className="size-5" aria-hidden="true" />
                {info.label}
              </span>
            )}
            <span
              className={`hidden min-w-0 max-w-[16rem] truncate text-base md:block lg:max-w-none ${navegacao ? "text-muted-foreground" : "text-primary-foreground/85"}`}
              title={session.email}
            >
              {session.email}
            </span>
            <Button
              variant="outline"
              className={`min-h-11 text-base ${navegacao ? "" : "border-primary-foreground/70 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"}`}
              onClick={sair}
            >
              <LogOut className="size-5" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      {navegacao}

      {navegacao && (
        <div aria-hidden="true" className="-mb-52 h-52 shrink-0 bg-primary sm:-mb-44 sm:h-44" />
      )}
      <main className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {titulo && (
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {titulo}
            </h1>
            {etiqueta}
          </div>
        )}

        <div className={titulo ? "mt-8 space-y-8" : "space-y-8"}>{children}</div>
      </main>

      <RodapeSite className="mt-12" largura={navegacao ? "painel" : "padrao"} />
    </div>
  );
}
