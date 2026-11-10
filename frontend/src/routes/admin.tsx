import { PainelAdmin } from "@/features/admin/PainelAdmin";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração · NOTUS" },
      {
        name: "description",
        content: "Painel administrativo: turmas, alunos matriculados, alunos novos e comunicados.",
      },
    ],
  }),
  component: PainelAdmin,
});
