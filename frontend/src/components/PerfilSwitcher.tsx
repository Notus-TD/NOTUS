import { Link } from "@tanstack/react-router";
import { GraduationCap, Users, ClipboardCheck } from "lucide-react";

const perfis = [
  { to: "/aluno", label: "Aluno", icon: GraduationCap, desc: "Beatriz, 7º ano B" },
  { to: "/responsavel", label: "Pai / Responsável", icon: Users, desc: "Sr. Antônio Camargo" },
  { to: "/professor", label: "Professor", icon: ClipboardCheck, desc: "Prof. Rafael Duarte" },
] as const;

export function PerfilSwitcher() {
  return (
    <nav aria-label="Alternar visão de perfil" className="grid gap-3 sm:grid-cols-3">
      {perfis.map((p) => (
        <Link
          key={p.to}
          to={p.to}
          className="group flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground group-data-[status=active]:bg-primary-foreground/15 group-data-[status=active]:text-primary-foreground">
            <p.icon className="size-6" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold">{p.label}</span>
            <span className="block truncate text-sm text-muted-foreground group-data-[status=active]:text-primary-foreground/80">
              {p.desc}
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
