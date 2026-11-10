import { type PublicoComunicado } from "@/api/comunicados";

export type Publico = PublicoComunicado;

export const rotuloPublico: Record<Publico, string> = {
  TODOS: "Toda a escola",
  ALUNOS: "Alunos",
  RESPONSAVEIS: "Responsáveis",
  PROFESSORES: "Professores",
};
