import { Bimestre } from "@/api/boletim";
import { getJson, sendJson } from "@/api/cliente";

export type SituacaoPeriodo = "NAO_INICIADO" | "EM_ANDAMENTO" | "FECHADO" | "REABERTO";

export type PeriodoDTO = {
  bimestre: Bimestre;
  descricao: string;
  inicio: string;
  fim: string;
  situacao: SituacaoPeriodo;
  lancamentoAberto: boolean;
};

export type CalendarioDTO = {
  anoLetivo: string;
  cadastrado: boolean;
  inicio: string | null;
  fim: string | null;
  bimestreAtual: Bimestre | null;
  periodos: PeriodoDTO[];
};

export type PeriodoRequest = { bimestre: Bimestre; inicio: string; fim: string };

export const getCalendario = (ano: string) => getJson<CalendarioDTO>(`/calendario/${ano}`);

export const salvarCalendario = (ano: string, periodos: PeriodoRequest[]) =>
  sendJson<CalendarioDTO>("PUT", `/calendario/${ano}`, { periodos });

export const reabrirBimestre = (ano: string, bimestre: Bimestre) =>
  sendJson<CalendarioDTO>("PUT", `/calendario/${ano}/${bimestre}/reabrir`);

export const fecharBimestre = (ano: string, bimestre: Bimestre) =>
  sendJson<CalendarioDTO>("PUT", `/calendario/${ano}/${bimestre}/fechar`);
