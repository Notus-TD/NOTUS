import { getJson, sendJson } from "@/api/cliente";

export type StatusNotificacao =
  "PENDENTE" | "ENVIANDO" | "ENVIADA" | "ENTREGUE" | "LIDA" | "FALHA" | "CANCELADA";

export type TipoNotificacao = "FALTA" | "ATIVIDADE" | "NOTA_FINAL" | "COMUNICADO";

export type NotificacaoDTO = {
  id: number;
  tipo: TipoNotificacao;
  status: StatusNotificacao;
  responsavelId: number;
  responsavelNome: string;
  email: string;
  studentId: number | null;
  studentNome: string | null;
  template: string;
  tentativas: number;
  erro: string | null;
  criadoEm: string;
  enviadoEm: string | null;
  proximaTentativaEm: string | null;
};

export type NotificacaoFiltro = {
  tipo?: TipoNotificacao | undefined;
  status?: StatusNotificacao | undefined;
  responsavelId?: number | undefined;
  de?: string | undefined;
  ate?: string | undefined;
};

export const getNotificacoes = (filtro?: NotificacaoFiltro) => {
  const params = new URLSearchParams();
  if (filtro?.tipo) params.set("tipo", filtro.tipo);
  if (filtro?.status) params.set("status", filtro.status);
  if (filtro?.responsavelId) params.set("responsavelId", String(filtro.responsavelId));
  if (filtro?.de) params.set("de", filtro.de);
  if (filtro?.ate) params.set("ate", filtro.ate);
  const query = params.toString();
  return getJson<NotificacaoDTO[]>(`/notificacao${query ? `?${query}` : ""}`);
};

export const reenviarNotificacao = (id: number) =>
  sendJson<NotificacaoDTO>("POST", `/notificacao/${id}/reenviar`);

export type AvisoDTO = {
  id: number;
  tipo: "FALTA" | "ATIVIDADE" | "NOTA_FINAL" | "COMUNICADO";
  titulo: string;
  texto: string;
  studentId: number | null;
  alunoNome: string | null;
  criadoEm: string;
};

export const getMeusAvisos = () => getJson<AvisoDTO[]>("/notificacao/me");
