import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
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
    <LegalPage titulo="Política de Privacidade">
      <PolicyContent />
    </LegalPage>
  );
}
