import { createFileRoute, Link } from "@tanstack/react-router";
import { PerfilSwitcher } from "@/components/PerfilSwitcher";
import { CalendarDays, BellRing, ClipboardCheck, ShieldCheck, UserPlus } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NOTUS · Portal de gestão escolar" },
      {
        name: "description",
        content:
          "Portal escolar NOTUS: atividades, notas, faltas e avisos em um só lugar para alunos, responsáveis e professores.",
      },
      { property: "og:title", content: "NOTUS · Portal de gestão escolar" },
      {
        property: "og:description",
        content:
          "Acompanhe atividades, notas, presença e comunicados da escola com clareza. Visões para aluno, responsável e professor.",
      },
    ],
  }),
  component: Index,
});

const destaques = [
  { icon: CalendarDays, titulo: "Atividades e prazos", texto: "O aluno vê o que entregar hoje, o que vem depois e o que ficou atrasado." },
  { icon: BellRing, titulo: "Avisos para a família", texto: "Reuniões, autorizações e recados dos professores em texto grande e claro." },
  { icon: ClipboardCheck, titulo: "Diário de classe", texto: "O professor faz a chamada, lança notas e publica recados em poucos toques." },
  { icon: ShieldCheck, titulo: "Informação confiável", texto: "Cada perfil vê apenas o que precisa, sempre com a mesma linguagem simples." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
              N
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">NOTUS</span>
          </Link>
          <span className="hidden text-base text-muted-foreground sm:block">Colégio Notus · 2026</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <section className="max-w-3xl">
          <p className="text-base font-semibold uppercase tracking-widest text-primary">
            Gestão escolar do 5º ano ao 9º ano
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            A vida escolar organizada, em palavras que todos entendem.
          </h1>
          <p className="mt-5 text-xl leading-relaxed text-muted-foreground">
            O NOTUS reúne atividades, notas, presença e avisos da escola em um portal só. Escolha
            abaixo a visão que deseja conhecer.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Escolha uma visão</h2>
          <PerfilSwitcher />
          <Link
            to="/cadastro"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-border bg-card px-4 text-base font-semibold text-foreground transition-colors hover:border-primary hover:bg-accent"
          >
            <UserPlus className="size-5" aria-hidden="true" />
            Secretaria · Cadastrar aluno
          </Link>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-2">
          <h2 className="sr-only">O que o portal oferece</h2>
          {destaques.map((d) => (
            <div key={d.titulo} className="rounded-2xl border border-border bg-card p-6">
              <d.icon className="size-7 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">{d.titulo}</h3>
              <p className="mt-2 text-base text-muted-foreground">{d.texto}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mt-12 border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-base text-muted-foreground sm:px-6">
          NOTUS · Portal de gestão escolar · Dúvidas: secretaria@colegionotus.com.br · (11) 4002-8922
        </div>
      </footer>
    </div>
  );
}
