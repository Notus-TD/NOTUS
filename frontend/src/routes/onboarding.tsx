import { OnboardingPage } from "@/features/auth/Onboarding";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Primeiro acesso · NOTUS" }],
  }),
  component: OnboardingPage,
});
