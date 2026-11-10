import { type StatusMatricula } from "@/api/alunos";

export const ALUNOS_POR_PAGINA = 15;

export const rotuloSituacao: Record<StatusMatricula, string> = {
  ATIVA: "Ativa",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

export const tomSituacao: Record<StatusMatricula, "sucesso" | "neutro" | "alerta"> = {
  ATIVA: "sucesso",
  FINALIZADA: "neutro",
  CANCELADA: "alerta",
};
