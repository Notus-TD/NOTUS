import { getJson, sendJson } from "@/api/cliente";

export type TipoSolicitacao = "ANONIMIZACAO" | "CORRECAO";

export type StatusSolicitacao = "ABERTA" | "ATENDIDA" | "RECUSADA";

export type SolicitacaoDTO = {
  id: number;
  tipo: TipoSolicitacao;
  status: StatusSolicitacao;
  solicitanteId: number;
  solicitanteNome: string;
  alunoId: number | null;
  alunoNome: string | null;
  detalhe: string | null;
  solicitadaEm: string;
  prazoEm: string;
  atrasada: boolean;
  respondidaEm: string | null;
  resposta: string | null;
};

export type SolicitacaoRequest = {
  tipo: TipoSolicitacao;
  alunoId: number | null;
  detalhe: string | null;
};

export const getMeusDados = () => getJson<unknown>("/privacidade/meus-dados");

export const solicitarPedidoTitular = (dto: SolicitacaoRequest) =>
  sendJson<SolicitacaoDTO>("POST", "/privacidade/solicitacoes", dto);

export const getMinhasSolicitacoes = () =>
  getJson<SolicitacaoDTO[]>("/privacidade/solicitacoes/me");

export const getSolicitacoes = () => getJson<SolicitacaoDTO[]>("/privacidade/solicitacoes");

export const responderSolicitacao = (
  id: number,
  dto: { status: Exclude<StatusSolicitacao, "ABERTA">; resposta: string | null },
) => sendJson<SolicitacaoDTO>("PUT", `/privacidade/solicitacoes/${id}/responder`, dto);
