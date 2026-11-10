import { LoginPage } from "@/features/auth/Login";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { recuperar?: boolean } =>
    search["recuperar"] === true || search["recuperar"] === "1" || search["recuperar"] === 1
      ? { recuperar: true }
      : {},
  head: () => ({
    meta: [
      { title: "Entrar · NOTUS" },
      { name: "description", content: "Acesse o portal escolar NOTUS com seu e-mail e senha." },
    ],
  }),
  component: LoginPage,
});
