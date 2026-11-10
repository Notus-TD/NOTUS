import type { StatusEntrega } from "@/api/atividades";

export const ORDEM_STATUS_ENTREGA: StatusEntrega[] = ["ENTREGUE", "ATRASADA", "NAO_ENTREGUE"];

export const STATUS_ENTREGA: Record<StatusEntrega, { label: string; classe: string }> = {
  ENTREGUE: { label: "Entregue", classe: "bg-success text-success-foreground" },
  ATRASADA: { label: "Atrasada", classe: "bg-warning text-warning-foreground" },
  NAO_ENTREGUE: { label: "Não entregue", classe: "bg-destructive text-destructive-foreground" },
};

export function formatarPontos(valor: number | null) {
  return valor === null ? "" : valor.toFixed(1).replace(".", ",");
}
