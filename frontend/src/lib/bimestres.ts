import type { Bimestre } from "@/lib/api";

export const BIMESTRES: { id: Bimestre; label: string }[] = [
  { id: "PRIMEIRO", label: "1º bimestre" },
  { id: "SEGUNDO", label: "2º bimestre" },
  { id: "TERCEIRO", label: "3º bimestre" },
  { id: "QUARTO", label: "4º bimestre" },
];

export function nomeBimestre(bimestre: Bimestre) {
  return BIMESTRES.find((b) => b.id === bimestre)?.label ?? bimestre;
}

export function bimestreAtual(hoje = new Date()): Bimestre {
  const mes = hoje.getMonth();
  if (mes <= 3) return "PRIMEIRO";
  if (mes <= 6) return "SEGUNDO";
  if (mes <= 8) return "TERCEIRO";
  return "QUARTO";
}
