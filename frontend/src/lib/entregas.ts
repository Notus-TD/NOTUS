import type { StatusEntrega } from "@/lib/api";

export const ORDEM_STATUS_ENTREGA: StatusEntrega[] = ["ENTREGUE", "ATRASADA", "NAO_ENTREGUE"];

export const STATUS_ENTREGA: Record<StatusEntrega, { label: string; classe: string }> = {
  ENTREGUE: { label: "Entregue", classe: "bg-success text-success-foreground" },
  ATRASADA: { label: "Atrasada", classe: "bg-warning text-warning-foreground" },
  NAO_ENTREGUE: { label: "Não entregue", classe: "bg-destructive text-destructive-foreground" },
};
