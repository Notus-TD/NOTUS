import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PolicyContent } from "@/components/PolicyContent";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade · NOTUS" },
      {
        name: "description",
        content:
          "Como o NOTUS coleta, usa e protege os dados pessoais de alunos, responsáveis e professores.",
      },
    ],
  }),
  component: PoliticaDePrivacidade,
});

function PoliticaDePrivacidade() {
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
          Política de Privacidade
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Última atualização: [DD/MM/AAAA]. Esta política se aplica ao portal NOTUS, mantido por
          [Razão Social do Colégio], CNPJ [00.000.000/0000-00], em conformidade com a Lei nº
          13.709/2018 (Lei Geral de Proteção de Dados Pessoais — LGPD).
        </p>

        <div className="mt-10">
          <PolicyContent />
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-base text-muted-foreground sm:px-6">
          NOTUS · Portal de gestão escolar · Dúvidas: secretaria@colegionotus.com.br · (11)
          4002-8922
        </div>
      </footer>
    </div>
  );
}
