import { PainelProfessor } from "@/features/professor/PainelProfessor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/professor")({
  head: () => ({
    meta: [
      { title: "Painel do Professor · NOTUS" },
      {
        name: "description",
        content:
          "Diário de classe simplificado: chamada, lançamento de notas e atividades para as turmas.",
      },
      { property: "og:title", content: "Painel do Professor · NOTUS" },
      {
        property: "og:description",
        content:
          "Faça a chamada, lance notas e publique atividades para suas turmas em poucos toques.",
      },
    ],
  }),
  component: PainelProfessor,
});
