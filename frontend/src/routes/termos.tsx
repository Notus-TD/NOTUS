import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/features/legal/LegalPage";
import { TermsContent } from "@/features/legal/TermsContent";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso · NOTUS" },
      {
        name: "description",
        content: "Regras de uso do portal escolar NOTUS para alunos, responsáveis e professores.",
      },
    ],
  }),
  component: TermosDeUso,
});

function TermosDeUso() {
  return (
    <LegalPage titulo="Termos de Uso">
      <TermsContent />
    </LegalPage>
  );
}
