import type { TipoSolicitacao } from "@/api/privacidade";

export const rotuloTipoSolicitacao: Record<TipoSolicitacao, string> = {
  ANONIMIZACAO: "Anonimização",
  CORRECAO: "Correção de dados",
};

export const formatarData = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("pt-BR");
