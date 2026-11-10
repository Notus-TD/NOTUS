import type { MotivoAnonimizacao, TipoSolicitacao } from "@/api/privacidade";

export const rotuloTipoSolicitacao: Record<TipoSolicitacao, string> = {
  ANONIMIZACAO: "Anonimização",
  CORRECAO: "Correção de dados",
};

export const formatarData = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("pt-BR");

export const MOTIVOS_ANONIMIZACAO: { id: MotivoAnonimizacao; rotulo: string }[] = [
  { id: "PEDIDO_DO_TITULAR", rotulo: "Pedido do titular" },
  { id: "FIM_DO_PRAZO_DE_GUARDA", rotulo: "Fim do prazo de guarda" },
  { id: "DETERMINACAO_LEGAL", rotulo: "Determinação legal ou judicial" },
  { id: "OUTRO", rotulo: "Outro motivo" },
];

export const formatarDataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
