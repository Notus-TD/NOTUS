import { RedefinirSenhaPage } from "@/features/auth/RedefinirSenha";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/redefinir-senha")({
  validateSearch: (search: Record<string, unknown>): { token?: string } =>
    typeof search["token"] === "string" && search["token"] ? { token: search["token"] } : {},
  head: () => ({
    meta: [{ title: "Definir senha · NOTUS" }, { name: "referrer", content: "no-referrer" }],
  }),
  component: RedefinirSenhaPage,
});
