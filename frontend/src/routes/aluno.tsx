import { PainelAluno } from "@/features/familia/aluno/PainelAluno";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/aluno")({
  head: () => ({
    meta: [
      { title: "Painel do Aluno · NOTUS" },
      {
        name: "description",
        content: "Resumo, notas, frequência e atividades.",
      },
      { property: "og:title", content: "Painel do Aluno · NOTUS" },
      {
        property: "og:description",
        content: "Veja suas atividades, notas e frequência em cada disciplina.",
      },
    ],
  }),
  component: PainelAluno,
});
