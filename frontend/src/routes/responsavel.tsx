import { PainelResponsavel } from "@/features/familia/responsavel/PainelResponsavel";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/responsavel")({
  head: () => ({
    meta: [
      { title: "Painel do Responsável · NOTUS" },
      {
        name: "description",
        content: "Resumo, boletim, frequência, atividades e avisos dos filhos.",
      },
      { property: "og:title", content: "Painel do Responsável · NOTUS" },
      {
        property: "og:description",
        content: "Acompanhe notas, faltas, atividades e comunicados da escola.",
      },
    ],
  }),
  component: PainelResponsavel,
});
